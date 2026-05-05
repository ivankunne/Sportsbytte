import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

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

  const { data: profile } = await admin
    .from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  let body: { listing_id?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 }); }

  const listingId = Number(body.listing_id);
  if (!listingId) return NextResponse.json({ error: "listing_id påkrevd" }, { status: 400 });

  const { data: listing } = await admin
    .from("listings")
    .select("id, created_at, is_sold")
    .eq("id", listingId)
    .eq("seller_id", profile.id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Annonse ikke funnet" }, { status: 404 });
  if (listing.is_sold) return NextResponse.json({ error: "Annonsen er allerede solgt" }, { status: 400 });

  const daysSince = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) {
    const daysLeft = Math.ceil(7 - daysSince);
    return NextResponse.json(
      { error: `Du kan fornye om ${daysLeft} dag${daysLeft !== 1 ? "er" : ""}` },
      { status: 429 }
    );
  }

  await admin.from("listings").update({ created_at: new Date().toISOString() }).eq("id", listingId);

  return NextResponse.json({ ok: true });
}
