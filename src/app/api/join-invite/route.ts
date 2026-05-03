import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "join-invite"), { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen senere." }, { status: 429 });
  }

  let body: { token: unknown; name: unknown; email?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { token, name, email, message } = body;

  if (typeof token !== "string" || !token.trim() || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }

  const safeToken = token.trim().slice(0, 128);
  const safeName = name.trim().slice(0, 100);
  const safeMessage = typeof message === "string" ? message.trim().slice(0, 1000) : undefined;

  const { data: club } = await admin
    .from("clubs")
    .select("id, invite_token, members")
    .eq("invite_token", safeToken)
    .maybeSingle();
  if (!club) return NextResponse.json({ error: "Ugyldig invitasjonslenke" }, { status: 404 });

  let { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("name", safeName)
    .limit(1)
    .maybeSingle();

  if (!profile) {
    const slug =
      safeName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString(36);
    const { data: newProfile, error } = await admin
      .from("profiles")
      .insert({ name: safeName, slug, avatar: safeName.slice(0, 2).toUpperCase(), club_id: club.id })
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

  // email is only used for domain-match auto-approval, not stored
  void email;

  const { error } = await admin.from("memberships").upsert({
    club_id: club.id,
    profile_id: profile!.id,
    status: "approved",
    message: safeMessage || null,
  });
  if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

  if (existing?.status !== "approved") {
    await admin.from("clubs").update({ members: club.members + 1 }).eq("id", club.id);
  }

  return NextResponse.json({ ok: true });
}
