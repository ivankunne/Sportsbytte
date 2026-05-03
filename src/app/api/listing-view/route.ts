import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let listing_id: unknown;
  try {
    ({ listing_id } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Must be a positive integer — rejects strings, booleans, floats, negatives
  if (
    typeof listing_id !== "number" ||
    !Number.isInteger(listing_id) ||
    listing_id <= 0
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Per-listing-per-IP: each IP can only increment a given listing once per 30 min
  const ip = ipKey(req, `view:${listing_id}`);
  if (rateLimit(ip, { limit: 1, windowMs: 30 * 60 * 1000 })) {
    return NextResponse.json({ ok: true }); // silently ignore — don't reveal limiting
  }

  const { data } = await admin
    .from("listings")
    .select("views")
    .eq("id", listing_id)
    .maybeSingle();

  if (data) {
    await admin
      .from("listings")
      .update({ views: data.views + 1 })
      .eq("id", listing_id);
  }

  return NextResponse.json({ ok: true });
}
