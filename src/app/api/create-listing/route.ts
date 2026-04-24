import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { SITE_URL } from "@/lib/email";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Separate anon client — used only to verify the user's JWT
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_COLUMNS = [
  "title", "description", "category", "condition", "price",
  "images", "specs", "club_id", "listing_type", "members_only",
  "quantity", "size_range", "is_sold",
] as const;

export async function POST(req: NextRequest) {
  // Require a valid Supabase session
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve the authenticated user's profile — seller_id is always set server-side
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  // Strip unknown columns and inject the verified seller_id
  const filtered: Record<string, unknown> = { seller_id: profile.id };
  for (const col of ALLOWED_COLUMNS) {
    if (col in body) filtered[col] = body[col];
  }

  // Basic required-field checks
  if (!filtered.title || typeof filtered.title !== "string" || !String(filtered.title).trim()) {
    return NextResponse.json({ error: "Tittel er påkrevd" }, { status: 400 });
  }
  if (typeof filtered.price !== "number" || filtered.price < 0) {
    return NextResponse.json({ error: "Ugyldig pris" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from("listings")
    .insert(filtered as any)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }

  fetch(`${SITE_URL}/api/notify-listing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "published", listing_id: data.id }),
  }).catch(() => {});

  return NextResponse.json({ id: data.id });
}
