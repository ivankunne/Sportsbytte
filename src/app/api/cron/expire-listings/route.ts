import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Database } from "@/lib/database.types";
import { buildEmail, p, infoBox, escapeHtml, FROM, SITE_URL } from "@/lib/email";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let warned = 0;
  let expired = 0;

  // ── 1. Expire listings past their expires_at ──────────────
  const { data: toExpire } = await admin
    .from("listings")
    .select("id, seller_id, title")
    .eq("is_sold", false)
    .not("expires_at", "is", null)
    .lte("expires_at", now.toISOString());

  for (const listing of toExpire ?? []) {
    await admin.from("listings").update({ is_sold: true }).eq("id", listing.id);
    expired++;
  }

  // ── 2. Warn sellers whose listing expires in 7 days ───────
  const warnFrom = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();
  const warnTo   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: toWarn } = await admin
    .from("listings")
    .select("id, title, price, expires_at, seller_id, profiles!listings_seller_id_fkey(id, name, auth_user_id)")
    .eq("is_sold", false)
    .gte("expires_at", warnFrom)
    .lte("expires_at", warnTo);

  for (const listing of toWarn ?? []) {
    const profile = (listing as Record<string, unknown>).profiles as { id: number; name: string; auth_user_id: string | null } | null;
    if (!profile?.auth_user_id) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(profile.auth_user_id);
    const email = authUser.user?.email;
    if (!email) continue;

    const safeTitle = escapeHtml(listing.title);
    const expiresDate = listing.expires_at
      ? new Date(listing.expires_at).toLocaleDateString("nb-NO", { day: "numeric", month: "long" })
      : "snart";
    const renewUrl = `${SITE_URL}/dashboard?tab=annonser`;
    const listingUrl = `${SITE_URL}/annonse/${listing.id}`;

    const html = buildEmail({
      heading: "Annonsen din utløper om 7 dager",
      kicker: "Påminnelse",
      body: `
        ${p(`Hei ${escapeHtml(profile.name.split(" ")[0])}!`)}
        ${p(`Annonsen din <strong>${safeTitle}</strong> utløper ${expiresDate}.`)}
        ${infoBox(
          `Hvis annonsen ikke er solgt, kan du fornye den med ett klikk for 20 ekstra dager. Ellers fjernes den automatisk.`,
          "Hva skjer?"
        )}
        ${p("Gå til dashbordet ditt for å fornye annonsen.")}
      `,
      cta: { href: renewUrl, label: "Gå til mine annonser" },
      footerNote: `Du mottar denne e-posten fordi du har en aktiv annonse på Sportsbytte. <a href="${listingUrl}" style="color:#0d9488;">Se annonsen</a>`,
    });

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Annonsen «${listing.title}» utløper om 7 dager`,
      html,
    }).catch(() => {});

    warned++;
  }

  return NextResponse.json({ expired, warned });
}
