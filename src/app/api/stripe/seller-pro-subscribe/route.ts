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

  const { data: profile } = await admin
    .from("profiles")
    .select("id, is_pro, stripe_subscription_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });
  if (profile.is_pro) return NextResponse.json({ error: "Du er allerede Pro" }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL er ikke satt" }, { status: 500 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "nok",
            unit_amount: 9900,
            recurring: { interval: "month" },
            product_data: {
              name: "Selger Pro",
              description: "2% transaksjonsgebyr · Fremhev 1 annonse gratis · Pro-badge",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${siteUrl}/dashboard?tab=profil&pro=success`,
      cancel_url: `${siteUrl}/dashboard?tab=profil`,
      metadata: { type: "seller_pro_subscription", profile_id: String(profile.id) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ukjent Stripe-feil";
    console.error("Seller pro subscribe error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
