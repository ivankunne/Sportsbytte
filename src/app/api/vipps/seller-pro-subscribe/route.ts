import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createAgreement } from "@/lib/vipps";

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
    .select("id, is_pro")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });
  if (profile.is_pro) return NextResponse.json({ error: "Du er allerede Pro" }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const agreement = await createAgreement({
    amountOre: 9900,
    productName: "Selger Pro",
    productDescription: "2% transaksjonsgebyr · Fremhev 1 annonse gratis · Pro-badge",
    merchantRedirectUrl: `${siteUrl}/dashboard?tab=profil&pro=success`,
    metadata: { type: "seller_pro_subscription", profile_id: String(profile.id) },
  });

  await admin.from("profiles").update({ vipps_agreement_id: agreement.agreementId }).eq("id", profile.id);

  return NextResponse.json({ url: agreement.vippsConfirmationUrl });
}
