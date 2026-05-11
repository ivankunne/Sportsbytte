import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { stopAgreement } from "@/lib/vipps";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("id, is_pro, vipps_agreement_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });
  if (!profile.is_pro) return NextResponse.json({ error: "Ingen aktiv Pro-abonnement" }, { status: 400 });

  if (profile.vipps_agreement_id) {
    try {
      await stopAgreement(profile.vipps_agreement_id);
    } catch (err) {
      console.error("Vipps stopAgreement failed:", err);
      // Still mark as cancelled locally — Vipps webhook will sync if needed
    }
  }

  await admin.from("profiles").update({
    is_pro: false,
    vipps_agreement_id: null,
  }).eq("id", profile.id);

  return NextResponse.json({ ok: true });
}
