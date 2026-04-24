import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { stripe, platformFee } from "@/lib/stripe";

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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let listing_id: number;
  try {
    ({ listing_id } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, title, price, is_sold, seller_id, images, clubs(is_pro), profiles(id, stripe_account_id, stripe_onboarding_complete)")
    .eq("id", listing_id)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonse ikke funnet" }, { status: 404 });
  if (listing.is_sold) return NextResponse.json({ error: "Annonsen er allerede solgt" }, { status: 400 });

  const seller = listing.profiles as { id: number; stripe_account_id: string | null; stripe_onboarding_complete: boolean } | null;
  const isPro = (listing.clubs as { is_pro: boolean } | null)?.is_pro ?? false;

  if (!seller?.stripe_account_id || !seller.stripe_onboarding_complete) {
    return NextResponse.json({ error: "Selgeren har ikke aktivert kortbetaling ennå" }, { status: 400 });
  }

  // Prevent seller from buying their own listing
  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (buyerProfile?.id === seller.id) {
    return NextResponse.json({ error: "Du kan ikke kjøpe din egen annonse" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const amountOre = listing.price * 100;
  const feeOre = platformFee(listing.price, isPro);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    currency: "nok",
    line_items: [
      {
        price_data: {
          currency: "nok",
          unit_amount: amountOre,
          product_data: {
            name: listing.title,
            ...(listing.images?.[0] ? { images: [listing.images[0]] } : {}),
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeOre,
      transfer_data: { destination: seller.stripe_account_id },
    },
    success_url: `${siteUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}&listing_id=${listing.id}`,
    cancel_url: `${siteUrl}/annonse/${listing.id}`,
    metadata: { listing_id: String(listing.id), buyer_auth_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
