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

// POST: block a user
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await resolveProfile(token);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json().catch(() => ({}));
  if (!blocked_id || blocked_id === profile.id) {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  await admin.from("blocked_users").upsert({
    blocker_id: profile.id,
    blocked_id: Number(blocked_id),
  }, { onConflict: "blocker_id,blocked_id" });

  return NextResponse.json({ ok: true, blocked: true });
}

// DELETE: unblock a user
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await resolveProfile(token);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocked_id } = await req.json().catch(() => ({}));
  if (!blocked_id) return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });

  await admin.from("blocked_users")
    .delete()
    .eq("blocker_id", profile.id)
    .eq("blocked_id", Number(blocked_id));

  return NextResponse.json({ ok: true, blocked: false });
}
