import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vipps Recurring webhook — fires on agreement and charge status changes.
// Register this URL in the Vipps developer portal under Webhooks.
// Configure the webhook secret in the portal to match VIPPS_CALLBACK_SECRET;
// Vipps sends it as the Authorization header value.
export async function POST(req: NextRequest) {
  const authToken = req.headers.get("authorization") ?? "";
  const expectedSecret = process.env.VIPPS_CALLBACK_SECRET ?? "";
  if (!expectedSecret || authToken !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    agreementId?: string;
    chargeId?: string;
    eventType?: string;   // e.g. "AGREEMENT_ACTIVATED", "AGREEMENT_STOPPED", "CHARGE_FAILED"
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { agreementId, eventType } = body;
  if (!agreementId || !eventType) return NextResponse.json({ received: true });

  // Agreement activated — mark Pro as active
  if (eventType === "AGREEMENT_ACTIVATED") {
    // Check clubs first
    const { data: club } = await admin
      .from("clubs")
      .select("id")
      .eq("vipps_agreement_id", agreementId)
      .maybeSingle();

    if (club) {
      await admin.from("clubs").update({ is_pro: true }).eq("id", club.id);
      return NextResponse.json({ received: true });
    }

    // Then profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("vipps_agreement_id", agreementId)
      .maybeSingle();

    if (profile) {
      await admin.from("profiles").update({ is_pro: true }).eq("id", profile.id);
    }
  }

  // Agreement stopped/expired — revoke Pro
  if (eventType === "AGREEMENT_STOPPED" || eventType === "AGREEMENT_EXPIRED") {
    const { data: club } = await admin
      .from("clubs")
      .select("id")
      .eq("vipps_agreement_id", agreementId)
      .maybeSingle();

    if (club) {
      await admin.from("clubs")
        .update({ is_pro: false, vipps_agreement_id: null })
        .eq("id", club.id);
      return NextResponse.json({ received: true });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("vipps_agreement_id", agreementId)
      .maybeSingle();

    if (profile) {
      await admin.from("profiles")
        .update({ is_pro: false, vipps_agreement_id: null })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}
