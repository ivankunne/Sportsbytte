import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let body: { token: string; name: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { token, name, email, message } = body;
  if (!token || !name?.trim()) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }

  const { data: club } = await admin
    .from("clubs")
    .select("id, invite_token, members")
    .eq("invite_token", token)
    .maybeSingle();
  if (!club) return NextResponse.json({ error: "Ugyldig invitasjonslenke" }, { status: 404 });

  let { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("name", name.trim())
    .limit(1)
    .maybeSingle();

  if (!profile) {
    const slug =
      name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString(36);
    const { data: newProfile, error } = await admin
      .from("profiles")
      .insert({ name: name.trim(), slug, avatar: name.trim().slice(0, 2).toUpperCase(), club_id: club.id })
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });
    if (!newProfile) return NextResponse.json({ error: "Intern feil" }, { status: 500 });
    profile = newProfile;
  }

  const { data: existing } = await admin
    .from("memberships")
    .select("status")
    .eq("club_id", club.id)
    .eq("profile_id", profile!.id)
    .maybeSingle();

  const { error } = await admin.from("memberships").upsert({
    club_id: club.id,
    profile_id: profile!.id,
    status: "approved",
    message: message?.trim() || null,
  });
  if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

  if (existing?.status !== "approved") {
    await admin.from("clubs").update({ members: club.members + 1 }).eq("id", club.id);
  }

  return NextResponse.json({ ok: true });
}
