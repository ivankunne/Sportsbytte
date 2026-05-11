import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { initiatePayout, sellerPayoutNok } from "@/lib/vipps";
import { buildEmail, p, FROM, SITE_URL, escapeHtml } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Called by buyer clicking "Mottatt" — releases escrow to seller.
// Also called internally by the auto-release cron.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;

  let transactionId: number;
  try {
    ({ transaction_id: transactionId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: tx } = await admin
    .from("transactions")
    .select("id, listing_id, buyer_profile_id, seller_profile_id, amount, status, provider")
    .eq("id", transactionId)
    .maybeSingle();

  if (!tx) return NextResponse.json({ error: "Transaksjon ikke funnet" }, { status: 404 });
  if (tx.provider !== "vipps") return NextResponse.json({ error: "Kun Vipps-transaksjoner" }, { status: 400 });
  if (tx.status !== "pending_confirmation") {
    return NextResponse.json({ error: "Transaksjonen kan ikke frigjøres" }, { status: 400 });
  }

  // Verify the caller is the buyer (unless cron)
  if (!isCron) {
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: buyerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (buyerProfile?.id !== tx.buyer_profile_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Get seller's Vipps phone for payout
  const { data: seller } = await admin
    .from("profiles")
    .select("vipps_phone, auth_user_id")
    .eq("id", tx.seller_profile_id!)
    .maybeSingle();

  const payoutAmountNok = sellerPayoutNok(tx.amount);
  const payoutId = `payout-${tx.id}-${randomUUID().slice(0, 8)}`;

  let payoutSucceeded = false;
  let payoutErrorMessage = "";

  if (seller?.vipps_phone) {
    // Normalise phone: ensure 47 country prefix, strip leading 0
    const digits = seller.vipps_phone.replace(/\D/g, "");
    const normalised = digits.startsWith("47") ? digits : `47${digits.replace(/^0/, "")}`;
    try {
      await initiatePayout({
        payoutId,
        recipientPhone: normalised,
        amountNok: payoutAmountNok,
        description: `Sportsbytte salg #${tx.listing_id}`,
        externalId: String(tx.listing_id),
      });
      payoutSucceeded = true;
    } catch (err) {
      payoutErrorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Vipps payout failed for tx ${tx.id}:`, payoutErrorMessage);
    }
  } else {
    payoutErrorMessage = "Selger mangler Vipps-telefonnummer";
    console.error(`Vipps payout skipped for tx ${tx.id}: no vipps_phone on seller ${tx.seller_profile_id}`);
  }

  // Mark transaction released — buyer confirmation is immutable.
  // payout_failed flag alerts admin to process manually.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("transactions") as any).update({
    status: "released",
    confirmed_at: new Date().toISOString(),
    ...(payoutSucceeded ? {} : { payout_failed: true, payout_error: payoutErrorMessage }),
  }).eq("id", tx.id);

  // Alert admin if payout failed so they can process manually
  if (!payoutSucceeded) {
    const adminEmail = process.env.ADMIN_EMAIL ?? "ivan@frameflow.no";
    const listingUrl = `${SITE_URL}/annonse/${tx.listing_id}`;
    resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `[UTBETALING FEILET] Transaksjon #${tx.id} — manuell overføring nødvendig`,
      html: `
        <h2>Vipps-utbetaling feilet — manuell behandling nødvendig</h2>
        <p><strong>Transaksjon:</strong> #${tx.id}</p>
        <p><strong>Annonse:</strong> <a href="${listingUrl}">${tx.listing_id}</a></p>
        <p><strong>Selger-ID:</strong> ${tx.seller_profile_id}</p>
        <p><strong>Beløp som skal overføres:</strong> ${payoutAmountNok.toLocaleString("nb-NO")} kr</p>
        <p><strong>Årsak til feil:</strong> ${payoutErrorMessage}</p>
        <p>Overfør beløpet manuelt via Vipps til selgers registrerte nummer, eller kontakt selger.</p>
      `,
    }).catch(() => {});
  }

  // Email seller — content depends on whether payout succeeded
  if (seller?.auth_user_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(seller.auth_user_id);
    const sellerEmail = authUser.user?.email;
    if (sellerEmail) {
      const { data: listing } = await admin
        .from("listings")
        .select("title")
        .eq("id", tx.listing_id!)
        .maybeSingle();

      const safeTitle = escapeHtml(listing?.title ?? "Ukjent annonse");

      const html = payoutSucceeded
        ? buildEmail({
            heading: "Pengene er på vei!",
            kicker: "Salg bekreftet",
            body: `
              ${p(`Kjøperen har bekreftet at de har mottatt <strong>${safeTitle}</strong>.`)}
              ${p(`${payoutAmountNok.toLocaleString("nb-NO")} kr er nå overført til din Vipps-konto.`)}
            `,
            cta: { href: `${SITE_URL}/dashboard`, label: "Se dashbordet ditt" },
            footerNote: "Du mottar denne e-posten fordi du solgte noe på Sportsbytte.",
          })
        : buildEmail({
            heading: "Varen er mottatt",
            kicker: "Salg bekreftet",
            body: `
              ${p(`Kjøperen har bekreftet at de har mottatt <strong>${safeTitle}</strong>.`)}
              ${p("Vi hadde et teknisk problem med å overføre betalingen til Vipps automatisk. Teamet vårt behandler dette manuelt og du vil motta betalingen innen 1–2 virkedager.")}
              ${p("Beklager ulempen — ta kontakt med oss dersom du ikke har hørt noe innen 48 timer.")}
            `,
            cta: { href: `${SITE_URL}/dashboard`, label: "Se dashbordet ditt" },
            footerNote: "Du mottar denne e-posten fordi du solgte noe på Sportsbytte.",
          });

      resend.emails.send({
        from: FROM,
        to: sellerEmail,
        subject: `${payoutSucceeded ? "Betaling frigjort" : "Varen mottatt — betaling behandles"}: ${listing?.title}`,
        html,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
