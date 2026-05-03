import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const email = req.nextUrl.searchParams.get("email");

  if (!id || isNaN(Number(id)) || !email?.trim()) {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  // Filter by both id AND notify_email — prevents IDOR where any user could
  // delete another person's saved search by guessing the numeric id.
  await admin
    .from("saved_searches")
    .delete()
    .eq("id", Number(id))
    .eq("notify_email", email.toLowerCase().trim());

  return NextResponse.json({ ok: true });
}
