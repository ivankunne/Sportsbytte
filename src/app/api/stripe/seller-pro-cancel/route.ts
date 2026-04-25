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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("id, stripe_subscription_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });
  if (!profile.stripe_subscription_id) {
    return NextResponse.json({ error: "Ingen aktiv Pro-abonnement" }, { status: 400 });
  }

  try {
    await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    await admin
      .from("profiles")
      .update({ is_pro: false, stripe_subscription_id: null })
      .eq("id", profile.id);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ukjent Stripe-feil";
    console.error("Seller pro cancel error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
