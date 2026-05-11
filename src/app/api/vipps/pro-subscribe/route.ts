import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createAgreement } from "@/lib/vipps";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin-triggered: create a Vipps Recurring agreement for a club Pro subscription.
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || req.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let club_slug: string;
  try {
    ({ club_slug } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: club } = await admin
    .from("clubs")
    .select("id, name, is_pro, slug")
    .eq("slug", club_slug)
    .maybeSingle();

  if (!club) return NextResponse.json({ error: "Klubb ikke funnet" }, { status: 404 });
  if (club.is_pro) return NextResponse.json({ error: "Klubben har allerede Pro" }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const agreement = await createAgreement({
    amountOre: 49900,
    productName: "Sportsbytte Pro",
    productDescription: "2% transaksjonsgebyr · prioritert synlighet · ubegrenset CSV-import",
    merchantRedirectUrl: `${siteUrl}/klubb/${club.slug}/admin?pro=success`,
    metadata: { club_id: String(club.id), type: "pro_subscription" },
  });

  // Store agreement ID so we can cancel later
  await admin.from("clubs").update({ vipps_agreement_id: agreement.agreementId }).eq("id", club.id);

  return NextResponse.json({ url: agreement.vippsConfirmationUrl });
}
