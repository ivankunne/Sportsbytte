import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let listing_id: number;
  try {
    ({ listing_id } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!listing_id) return NextResponse.json({ ok: false }, { status: 400 });

  const { data } = await admin.from("listings").select("views").eq("id", listing_id).maybeSingle();
  if (data) {
    await admin.from("listings").update({ views: data.views + 1 }).eq("id", listing_id);
  }
  return NextResponse.json({ ok: true });
}
