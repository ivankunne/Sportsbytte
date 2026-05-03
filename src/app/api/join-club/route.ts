import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "join-club"), { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen senere." }, { status: 429 });
  }

  let body: { clubId: unknown; name: unknown; email?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { clubId, name, email, message } = body;

  if (
    typeof clubId !== "number" || !Number.isInteger(clubId) || clubId <= 0 ||
    typeof name !== "string" || !name.trim()
  ) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }

  const safeName = name.trim().slice(0, 100);
  const safeEmail = typeof email === "string" ? email.trim().slice(0, 254) : undefined;
  const safeMessage = typeof message === "string" ? message.trim().slice(0, 1000) : undefined;

  // Fetch club to get email domain setting — server-side, can't be spoofed by client
  const { data: club } = await admin
    .from("clubs")
    .select("id, member_email_domain")
    .eq("id", clubId)
    .maybeSingle();

  if (!club) return NextResponse.json({ error: "Klubb ikke funnet" }, { status: 404 });

  // Compute status server-side — client never sends it
  const normalizedDomain = club.member_email_domain?.replace(/^@/, "").toLowerCase();
  const status: "pending" | "approved" =
    normalizedDomain && safeEmail?.toLowerCase().endsWith(`@${normalizedDomain}`)
      ? "approved"
      : "pending";

  // Find or create a profile by name
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
      .insert({ name: safeName, slug, avatar: safeName.slice(0, 2).toUpperCase() })
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });
    if (!newProfile) return NextResponse.json({ error: "Intern feil" }, { status: 500 });
    profile = newProfile;
  }

  const { data: existing } = await admin
    .from("memberships")
    .select("status")
    .eq("club_id", clubId)
    .eq("profile_id", profile!.id)
    .maybeSingle();

  const { error } = await admin.from("memberships").upsert({
    club_id: clubId,
    profile_id: profile!.id,
    message: safeMessage || null,
    status,
  });

  if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

  if (status === "approved" && existing?.status !== "approved") {
    const { data: currClub } = await admin.from("clubs").select("members").eq("id", clubId).maybeSingle();
    if (currClub) {
      await admin.from("clubs").update({ members: currClub.members + 1 }).eq("id", clubId);
    }
  }

  return NextResponse.json({ ok: true, status });
}
