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
            .single();
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

      // ── Listing payment ────────────────────────────────
      const listingId = Number(session.metadata?.listing_id);
      const buyerAuthId = session.metadata?.buyer_auth_id ?? null;
      if (!listingId) break;

      await admin.from("listings").update({ is_sold: true }).eq("id", listingId);

      const { data: listing } = await admin
        .from("listings")
        .select("seller_id, title, price")
        .eq("id", listingId)
        .single();

      if (listing) {
        // Increment seller's total_sold
        const { data: profile } = await admin
          .from("profiles")
          .select("total_sold")
          .eq("id", listing.seller_id)
          .single();
        if (profile) {
          await admin
            .from("profiles")
            .update({ total_sold: profile.total_sold + 1 })
            .eq("id", listing.seller_id);
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

        // Buyer confirmation email
        if (buyerAuthId) {
          const { data: buyerAuth } = await admin.auth.admin.getUserById(buyerAuthId);
          const buyerEmail = buyerAuth.user?.email;
          if (buyerEmail) {
            const listingUrl = `${SITE_URL}/annonse/${listingId}`;
            const safeTitle = escapeHtml(listing.title);
            const price = listing.price.toLocaleString("nb-NO");
            const html = buildEmail({
              heading: "Betaling bekreftet!",
              kicker: "Kjøp gjennomført",
              body: `
                ${p("Takk for kjøpet ditt på Sportsbytte!")}
                ${infoBox(`${safeTitle}\n${price} kr`, "Din ordre")}
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
      await admin
        .from("clubs")
        .update({ is_pro: false, stripe_subscription_id: null })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
