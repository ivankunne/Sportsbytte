import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { sendPushToProfile } from "@/lib/push";

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

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: buyerProfile } = await admin
    .from("profiles").select("id, name").eq("auth_user_id", user.id).maybeSingle();
  if (!buyerProfile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const body = await req.json() as { listing_id?: number; amount?: number; message?: string };
  const listingId = Number(body.listing_id);
  const amount = Number(body.amount);
  if (!listingId || !amount || amount <= 0) {
    return NextResponse.json({ error: "listing_id og amount påkrevd" }, { status: 400 });
  }

  const { data: listing } = await admin
    .from("listings").select("id, title, seller_id, is_sold").eq("id", listingId).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Annonse ikke funnet" }, { status: 404 });
  if (listing.is_sold) return NextResponse.json({ error: "Annonsen er allerede solgt" }, { status: 400 });
  if (listing.seller_id === buyerProfile.id) return NextResponse.json({ error: "Kan ikke by på eget utstyr" }, { status: 400 });

  const { data: offer, error } = await admin.from("offers").insert({
    listing_id: listingId,
    buyer_profile_id: buyerProfile.id,
    seller_profile_id: listing.seller_id,
    amount,
    message: body.message?.trim() || null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sendPushToProfile(listing.seller_id, {
    title: "Nytt bud mottatt",
    body: `${buyerProfile.name} bød ${amount.toLocaleString("nb-NO")} kr på "${listing.title}"`,
    url: "/dashboard?tab=tilbud",
  });

  return NextResponse.json({ ok: true, offer_id: offer.id });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const { data: received } = await admin
    .from("offers")
    .select("*, listings(id, title, price, images), buyer:profiles!offers_buyer_profile_id_fkey(id, name, avatar)")
    .eq("seller_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: sent } = await admin
    .from("offers")
    .select("*, listings(id, title, price, images), seller:profiles!offers_seller_profile_id_fkey(id, name, avatar)")
    .eq("buyer_profile_id", profile.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ received: received ?? [], sent: sent ?? [] });
}
