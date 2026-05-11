import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createCharge, getAgreement } from "@/lib/vipps";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRO_AMOUNT_ORE = 9900; // 99 kr in øre

// Run on the 1st of each month via Vercel Cron or external scheduler.
// Creates Vipps Recurring charges for all active Pro subscribers.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Due date is today — Vipps charges on this date
  const dueDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const results = { profiles: { charged: 0, skipped: 0, failed: 0 }, clubs: { charged: 0, skipped: 0, failed: 0 } };

  // ── Seller Pro profiles ───────────────────────────────────
  const { data: proProfiles } = await admin
    .from("profiles")
    .select("id, name, vipps_agreement_id")
    .eq("is_pro", true)
    .not("vipps_agreement_id", "is", null);

  for (const profile of proProfiles ?? []) {
    if (!profile.vipps_agreement_id) continue;
    try {
      const agreement = await getAgreement(profile.vipps_agreement_id);
      if (agreement.status !== "ACTIVE") {
        // Agreement no longer active — revoke Pro
        await admin.from("profiles")
          .update({ is_pro: false, vipps_agreement_id: null })
          .eq("id", profile.id);
        results.profiles.skipped++;
        continue;
      }
      await createCharge({
        agreementId: profile.vipps_agreement_id,
        amountOre: PRO_AMOUNT_ORE,
        description: "Sportsbytte Selger Pro — månedlig",
        dueDate,
      });
      results.profiles.charged++;
    } catch (err) {
      console.error(`Vipps Pro charge failed for profile ${profile.id}:`, err);
      results.profiles.failed++;
    }
  }

  // ── Club Pro subscriptions ────────────────────────────────
  const { data: proClubs } = await admin
    .from("clubs")
    .select("id, name, vipps_agreement_id")
    .eq("is_pro", true)
    .not("vipps_agreement_id", "is", null);

  for (const club of proClubs ?? []) {
    if (!club.vipps_agreement_id) continue;
    try {
      const agreement = await getAgreement(club.vipps_agreement_id);
      if (agreement.status !== "ACTIVE") {
        await admin.from("clubs")
          .update({ is_pro: false, vipps_agreement_id: null })
          .eq("id", club.id);
        results.clubs.skipped++;
        continue;
      }
      await createCharge({
        agreementId: club.vipps_agreement_id,
        amountOre: PRO_AMOUNT_ORE,
        description: "Sportsbytte Klubb Pro — månedlig",
        dueDate,
      });
      results.clubs.charged++;
    } catch (err) {
      console.error(`Vipps Pro charge failed for club ${club.id}:`, err);
      results.clubs.failed++;
    }
  }

  return NextResponse.json({ ok: true, dueDate, results });
}
