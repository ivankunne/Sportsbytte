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
    .select("id, stripe_subscription_id, is_pro")
    .eq("slug", club_slug)
    .maybeSingle();

  if (!club) return NextResponse.json({ error: "Klubb ikke funnet" }, { status: 404 });
  if (!club.is_pro) return NextResponse.json({ error: "Klubben har ikke Pro" }, { status: 400 });

  if (club.stripe_subscription_id) {
    await stripe.subscriptions.cancel(club.stripe_subscription_id);
  }

  await admin
    .from("clubs")
    .update({ is_pro: false, stripe_subscription_id: null })
    .eq("id", club.id);

  return NextResponse.json({ ok: true });
}
