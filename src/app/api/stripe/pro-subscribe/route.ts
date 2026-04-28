import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { stripe } from "@/lib/stripe";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || req.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let club_slug: string;
  try {
    ({ club_slug } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: club } = await admin
    .from("clubs")
    .select("id, name, stripe_customer_id, is_pro")
    .eq("slug", club_slug)
    .maybeSingle();

  if (!club) return NextResponse.json({ error: "Klubb ikke funnet" }, { status: 404 });
  if (club.is_pro) return NextResponse.json({ error: "Klubben har allerede Pro" }, { status: 400 });

  // Create or reuse Stripe customer
  let customerId = club.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: club.name,
      metadata: { club_id: String(club.id) },
    });
    customerId = customer.id;
    await admin.from("clubs").update({ stripe_customer_id: customerId }).eq("id", club.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "nok",
          product_data: {
            name: "Sportsbytte Pro",
            description: "2 % transaksjonsgebyr · prioritert synlighet · ubegrenset CSV-import",
          },
          unit_amount: 49900,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/klubb/${club_slug}/admin?pro=success`,
    cancel_url: `${siteUrl}/klubb/${club_slug}/admin`,
    metadata: { club_id: String(club.id), type: "pro_subscription" },
  });

  return NextResponse.json({ url: session.url });
}
