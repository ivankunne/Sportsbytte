import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SITE_URL } from "@/lib/email";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Run daily via Vercel Cron or external scheduler.
// Releases any Vipps escrow payments where release_at has passed
// and the buyer hasn't confirmed or disputed.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: overdue } = await admin
    .from("transactions")
    .select("id")
    .eq("status", "pending_confirmation")
    .eq("provider", "vipps")
    .lte("release_at", new Date().toISOString());

  let released = 0;
  for (const tx of overdue ?? []) {
    try {
      await fetch(`${SITE_URL}/api/vipps/release-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ transaction_id: tx.id }),
      });
      released++;
    } catch {
      // Log but continue with remaining transactions
    }
  }

  return NextResponse.json({ released });
}
