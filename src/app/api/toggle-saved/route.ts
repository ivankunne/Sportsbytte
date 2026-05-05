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

  const { data: existing } = await admin
    .from("saved_listings")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await admin.from("saved_listings").delete().eq("id", existing.id);
    return NextResponse.json({ saved: false });
  } else {
    await admin.from("saved_listings").insert({ profile_id: profile.id, listing_id: listingId });
    return NextResponse.json({ saved: true });
  }
}
