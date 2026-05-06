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

async function resolveProfile(token: string) {
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return null;
  const { data: prof } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  return prof ?? null;
}

// GET: load draft
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ draft: null });
  const profile = await resolveProfile(token);
  if (!profile) return NextResponse.json({ draft: null });

  const { data } = await admin
    .from("listing_drafts")
    .select("form_data, updated_at")
    .eq("seller_id", profile.id)
    .maybeSingle();

  return NextResponse.json({ draft: data ?? null });
}

// PUT: upsert draft
export async function PUT(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await resolveProfile(token);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });

  await admin.from("listing_drafts").upsert({
    seller_id: profile.id,
    form_data: body,
    updated_at: new Date().toISOString(),
  }, { onConflict: "seller_id" });

  return NextResponse.json({ ok: true });
}

// DELETE: clear draft
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await resolveProfile(token);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await admin.from("listing_drafts").delete().eq("seller_id", profile.id);
  return NextResponse.json({ ok: true });
}
