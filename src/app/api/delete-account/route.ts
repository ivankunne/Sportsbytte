import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profile) {
    // Nullify seller_id on listings (keep listings but disassociate)
    await admin.from("listings").update({ is_sold: true }).eq("seller_id", profile.id).eq("is_sold", false);
    // Delete memberships and reviews authored by this user
    await admin.from("memberships").delete().eq("profile_id", profile.id);
    await admin.from("reviews").delete().eq("reviewer_id", profile.id);
    // Delete the profile
    await admin.from("profiles").delete().eq("id", profile.id);
  }

  // Delete the Supabase auth user — this is the point of no return
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Failed to delete auth user:", deleteError);
    return NextResponse.json({ error: "Intern feil ved sletting" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
