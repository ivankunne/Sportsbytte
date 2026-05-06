import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_REASONS = ["scam", "wrong_category", "inappropriate", "already_sold", "other"] as const;

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "report-listing"), { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange rapporter. Prøv igjen senere." }, { status: 429 });
  }

  let body: { listing_id?: number; reason?: string; description?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 }); }

  const listingId = Number(body.listing_id);
  if (!listingId) return NextResponse.json({ error: "listing_id påkrevd" }, { status: 400 });
  if (!body.reason || !VALID_REASONS.includes(body.reason as typeof VALID_REASONS[number])) {
    return NextResponse.json({ error: "Ugyldig årsak" }, { status: 400 });
  }

  // Resolve reporter if logged in (optional)
  let reporterProfileId: number | null = null;
  let reporterEmail: string | null = null;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token) {
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (user) {
      reporterEmail = user.email ?? null;
      const { data: prof } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
      reporterProfileId = prof?.id ?? null;
    }
  }

  const { error } = await admin.from("reports").insert({
    listing_id: listingId,
    reporter_id: reporterProfileId,
    reporter_email: reporterEmail,
    reason: body.reason,
    description: body.description?.slice(0, 500) ?? null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
