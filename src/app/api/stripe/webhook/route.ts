import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { stripe } from "@/lib/stripe";
import { buildEmail, p, infoBox, escapeHtml, FROM, SITE_URL } from "@/lib/email";
import type Stripe from "stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // ── Pro subscription via registration form ─────────
      if (session.mode === "subscription" && session.metadata?.type === "pro_registration") {
        const contactEmail = session.metadata.contact_email;
        if (contactEmail) {
          // Mark the pending registration as paid
          const { data: reg } = await admin
            .from("club_registrations")
            .select("id, description")
            .eq("email", contactEmail)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (reg) {
            const updatedDesc = (reg.description ?? "").replace("[PRO SØKNAD]", "[PRO BETALT]");
            await admin.from("club_registrations").update({ description: updatedDesc }).eq("id", reg.id);
          }
        }
        break;
      }

      // ── Pro subscription purchase ──────────────────────
      if (session.mode === "subscription" && session.metadata?.type === "pro_subscription") {
        const clubId = Number(session.metadata.club_id);
        if (clubId) {
          await admin.from("clubs").update({
            is_pro: true,
            stripe_subscription_id: String(session.subscription ?? ""),
            stripe_customer_id: String(session.customer ?? ""),
          }).eq("id", clubId);
        }
        break;
      }

      // ── Seller Pro subscription ────────────────────────
      if (session.mode === "subscription" && session.metadata?.type === "seller_pro_subscription") {
        const profileId = Number(session.metadata.profile_id);
        if (profileId) {
          await admin.from("profiles").update({
            is_pro: true,
            stripe_subscription_id: String(session.subscription ?? ""),
          }).eq("id", profileId);
        }
        break;
      }

      // ── Listing boost payment ──────────────────────────
      if (session.mode === "payment" && session.metadata?.type === "listing_boost") {
        const listingId = Number(session.metadata.listing_id);
        if (listingId) {
          const boostedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await admin.from("listings").update({
            is_boosted: true,
            boosted_until: boostedUntil,
          }).eq("id", listingId);
        }
        break;
      }

      // ── Listing payment ────────────────────────────────
      const listingId = Number(session.metadata?.listing_id);
      const buyerAuthId = session.metadata?.buyer_auth_id ?? null;
      if (!listingId) break;

      // Resolve buyer profile for purchase tracking and bulk quantity handling
      let buyerProfileId: number | null = null;
      if (buyerAuthId) {
        const { data: bp } = await admin.from("profiles").select("id").eq("auth_user_id", buyerAuthId).maybeSingle();
        buyerProfileId = bp?.id ?? null;
      }

      // For bulk listings: decrement quantity; mark sold only when stock hits 0
      const { data: listingStock } = await admin
        .from("listings")
        .select("quantity")
        .eq("id", listingId)
        .maybeSingle();

      const qty = listingStock?.quantity ?? null;
      if (qty !== null && qty > 1) {
        await admin.from("listings").update({ quantity: qty - 1 }).eq("id", listingId);
      } else {
        await admin.from("listings").update({
          is_sold: true,
          ...(buyerProfileId ? { buyer_profile_id: buyerProfileId } : {}),
        }).eq("id", listingId);
      }

      const { data: listing } = await admin
        .from("listings")
        .select("seller_id, title, price, club_id")
        .eq("id", listingId)
        .maybeSingle();

      if (listing) {
        // Increment seller's total_sold and update club counters
        const { data: profile } = await admin
          .from("profiles")
          .select("total_sold, is_pro")
          .eq("id", listing.seller_id)
          .maybeSingle();
        if (profile) {
          await admin
            .from("profiles")
            .update({ total_sold: profile.total_sold + 1 })
            .eq("id", listing.seller_id);
        }

        // Keep club stats in sync (only decrement active_listings when fully sold)
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
            // Bulk: only increment total_sold
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

        // Notify seller via email
        fetch(`${SITE_URL}/api/notify-listing`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": process.env.NOTIFY_WEBHOOK_SECRET ?? "",
          },
          body: JSON.stringify({ type: "sold", listing_id: listingId }),
        }).catch(() => {});

        // Buyer confirmation email with fee breakdown
        if (buyerAuthId) {
          const { data: buyerAuth } = await admin.auth.admin.getUserById(buyerAuthId);
          const buyerEmail = buyerAuth.user?.email;
          if (buyerEmail) {
            const isPro = (profile?.is_pro ?? false) || clubIsPro;
            const feeNok = Math.round(listing.price * (isPro ? 2 : 5)) / 100;
            const totalNok = listing.price + feeNok;
            const listingUrl = `${SITE_URL}/annonse/${listingId}`;
            const safeTitle = escapeHtml(listing.title);
            const html = buildEmail({
              heading: "Betaling bekreftet!",
              kicker: "Kjøp gjennomført",
              body: `
                ${p("Takk for kjøpet ditt på Sportsbytte! Her er kvitteringen din:")}
                ${infoBox(
                  `${safeTitle}`,
                  "Din ordre"
                )}
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
                ${p("Selgeren vil kontakte deg for å avtale levering. Du kan også sende en melding direkte i appen.")}
              `,
              cta: { href: listingUrl, label: "Se annonsen" },
              footerNote: "Du mottar denne e-posten fordi du fullførte et kjøp på Sportsbytte.",
            });
            resend.emails.send({
              from: FROM,
              to: buyerEmail,
              subject: `Betaling bekreftet: ${listing.title}`,
              html,
            }).catch(() => {});
          }
        }
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      if (account.charges_enabled && account.details_submitted) {
        await admin
          .from("profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("stripe_account_id", account.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await Promise.all([
        admin.from("clubs")
          .update({ is_pro: false, stripe_subscription_id: null })
          .eq("stripe_subscription_id", sub.id),
        admin.from("profiles")
          .update({ is_pro: false, stripe_subscription_id: null })
          .eq("stripe_subscription_id", sub.id),
      ]);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
