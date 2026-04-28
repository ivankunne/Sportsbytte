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
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
    return NextResponse.json({ error: "Ingen aktiv Stripe-konto" }, { status: 404 });
  }

  const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
  return NextResponse.json({ url: loginLink.url });
}
