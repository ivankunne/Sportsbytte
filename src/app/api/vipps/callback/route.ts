import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { buildEmail, p, infoBox, escapeHtml, FROM, SITE_URL } from "@/lib/email";
import { platformFeeNok } from "@/lib/vipps";

const resend = new Resend(process.env.RESEND_API_KEY);
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vipps sends payment events to this endpoint.
// Secured via the Authorization header — value is VIPPS_CALLBACK_SECRET,
// passed to Vipps as callbackAuthorizationToken when creating the payment.
export async function POST(req: NextRequest) {
  const authToken = req.headers.get("authorization") ?? "";
  const expectedSecret = process.env.VIPPS_CALLBACK_SECRET ?? "";
  if (!expectedSecret || authToken !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { reference?: string; name?: string; success?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reference, name: eventName, success } = body;
  if (!reference) return NextResponse.json({ received: true });

  // Only process successful AUTHORIZED or SALE events
  if (!success || (eventName !== "AUTHORIZED" && eventName !== "SALE")) {
    if (eventName === "ABORTED" || eventName === "EXPIRED" || eventName === "FAILED") {
      await admin.from("transactions").delete()
        .eq("vipps_reference", reference)
        .eq("status", "pending");
    }
    return NextResponse.json({ received: true });
  }

  const { data: tx } = await admin
    .from("transactions")
    .select("id, listing_id, buyer_profile_id, seller_profile_id, amount")
    .eq("vipps_reference", reference)
    .eq("status", "pending")
    .maybeSingle();

  // Already processed (idempotency guard) or unknown reference
  if (!tx) return NextResponse.json({ received: true });

  const listingId = tx.listing_id!;
  const buyerProfileId = tx.buyer_profile_id;

  // Check listing stock before committing anything
  const { data: listingStock } = await admin
    .from("listings")
    .select("quantity, is_sold")
    .eq("id", listingId)
    .maybeSingle();

  if (listingStock?.is_sold && (listingStock.quantity === null || listingStock.quantity <= 0)) {
    // Race condition: already sold — alert admin, leave transaction as pending for manual review
    console.error(`Vipps callback: listing ${listingId} already sold, ref=${reference}. Manual refund may be needed.`);
    return NextResponse.json({ received: true });
  }

  // Update listing FIRST, then claim transaction status (safer ordering).
  // If the listing update fails we want the transaction to stay pending so
  // Vipps can retry rather than leaving a paid-but-unlocked listing.
  const qty = listingStock?.quantity ?? null;
  let listingUpdateOk = false;

  if (qty !== null && qty > 1) {
    const { error: listingErr } = await admin
      .from("listings")
      .update({ quantity: qty - 1 })
      .eq("id", listingId);
    listingUpdateOk = !listingErr;
  } else {
    const { error: listingErr } = await admin
      .from("listings")
      .update({
        is_sold: true,
        ...(buyerProfileId ? { buyer_profile_id: buyerProfileId } : {}),
      })
      .eq("id", listingId);
    listingUpdateOk = !listingErr;
  }

  if (!listingUpdateOk) {
    console.error(`Vipps callback: listing update failed for ${listingId}, ref=${reference}. Will not advance transaction status.`);
    return NextResponse.json({ error: "Listing update failed" }, { status: 500 });
  }

  // Now claim the transaction — subsequent retries will find no pending row and exit early
  await admin.from("transactions")
    .update({ status: "pending_confirmation" })
    .eq("id", tx.id);

  const { data: listing } = await admin
    .from("listings")
    .select("seller_id, title, price, club_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return NextResponse.json({ received: true });

  // Increment seller total_sold (best-effort — not critical)
  const { data: sellerProfile } = await admin
    .from("profiles")
    .select("total_sold, is_pro")
    .eq("id", listing.seller_id)
    .maybeSingle();

  if (sellerProfile) {
    await admin.from("profiles")
      .update({ total_sold: sellerProfile.total_sold + 1 })
      .eq("id", listing.seller_id);
  }

  // Club stats (best-effort)
  let clubIsPro = false;
  if (listing.club_id) {
    if (qty === null || qty <= 1) {
      const { data: club } = await admin
        .from("clubs")
        .select("total_sold, active_listings, is_pro")
        .eq("id", listing.club_id)
        .maybeSingle();
      if (club) {
        clubIsPro = club.is_pro ?? false;
        await admin.from("clubs").update({
          total_sold: club.total_sold + 1,
          active_listings: Math.max(0, club.active_listings - 1),
        }).eq("id", listing.club_id);
      }
    } else {
      const { data: club } = await admin
        .from("clubs")
        .select("total_sold, is_pro")
        .eq("id", listing.club_id)
        .maybeSingle();
      if (club) {
        clubIsPro = club.is_pro ?? false;
        await admin.from("clubs").update({ total_sold: club.total_sold + 1 }).eq("id", listing.club_id);
      }
    }
  }

  // Notify seller (best-effort)
  fetch(`${SITE_URL}/api/notify-listing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": process.env.NOTIFY_WEBHOOK_SECRET ?? "",
    },
    body: JSON.stringify({ type: "sold", listing_id: listingId }),
  }).catch(() => {});

  // Buyer confirmation email (best-effort)
  if (buyerProfileId) {
    const { data: buyerAuth } = await admin
      .from("profiles")
      .select("auth_user_id")
      .eq("id", buyerProfileId)
      .maybeSingle();

    if (buyerAuth?.auth_user_id) {
      const { data: authUser } = await admin.auth.admin.getUserById(buyerAuth.auth_user_id);
      const buyerEmail = authUser.user?.email;
      if (buyerEmail) {
        const isPro = (sellerProfile?.is_pro ?? false) || clubIsPro;
        const feeNok = platformFeeNok(listing.price, isPro);
        const totalNok = listing.price + feeNok;
        const safeTitle = escapeHtml(listing.title);
        const confirmUrl = `${SITE_URL}/dashboard?tab=kjøp`;
        const html = buildEmail({
          heading: "Betaling fullført!",
          kicker: "Kjøp gjennomført",
          body: `
            ${p("Takk for kjøpet ditt på Sportsbytte! Her er kvitteringen din:")}
            ${infoBox(safeTitle, "Din ordre")}
            <table width="100%" style="border-collapse:collapse;margin:16px 0 20px;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#4b5563;">Varepris</td>
                <td style="padding:6px 0;text-align:right;color:#4b5563;">${listing.price.toLocaleString("nb-NO")} kr</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#4b5563;">Servicegebyr</td>
                <td style="padding:6px 0;text-align:right;color:#4b5563;">${feeNok.toLocaleString("nb-NO")} kr</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:10px 0 4px;font-weight:700;color:#1c1917;">Totalt betalt</td>
                <td style="padding:10px 0 4px;text-align:right;font-weight:700;color:#134e4a;">${totalNok.toLocaleString("nb-NO")} kr</td>
              </tr>
            </table>
            ${p("Selgeren vil kontakte deg for å avtale levering. Når du har mottatt varen, trykker du <strong>\"Mottatt\"</strong> i dashbordet ditt, og selgeren får pengene sine.")}
            ${p("Trykker du ikke, frigjøres pengene automatisk til selger etter 7 dager.")}
          `,
          cta: { href: confirmUrl, label: "Gå til kjøpene mine" },
          footerNote: "Du mottar denne e-posten fordi du fullførte et kjøp på Sportsbytte.",
        });
        resend.emails.send({
          from: FROM,
          to: buyerEmail,
          subject: `Betaling fullført: ${listing.title}`,
          html,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ received: true });
}
