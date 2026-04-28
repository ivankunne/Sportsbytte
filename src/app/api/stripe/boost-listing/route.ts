import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { stripe } from "@/lib/stripe";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let listing_id: number;
  try {
    ({ listing_id } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const { data: listing } = await admin
    .from("listings")
    .select("id, title, is_sold, seller_id")
    .eq("id", listing_id)
    .eq("seller_id", profile.id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Annonse ikke funnet" }, { status: 404 });
  if (listing.is_sold) return NextResponse.json({ error: "Solgte annonser kan ikke fremheves" }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL er ikke satt" }, { status: 500 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "nok",
            unit_amount: 3900,
            product_data: {
              name: `Fremhev annonse: ${listing.title}`,
              description: "Annonsen vises øverst i søkeresultater i 7 dager",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${siteUrl}/dashboard?tab=annonser&boost=success`,
      cancel_url: `${siteUrl}/dashboard?tab=annonser`,
      metadata: { type: "listing_boost", listing_id: String(listing.id) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ukjent Stripe-feil";
    console.error("Boost listing error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
