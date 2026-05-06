import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Database } from "@/lib/database.types";
import { buildEmail, p, escapeHtml, FROM, SITE_URL } from "@/lib/email";

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

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all clubs
  const { data: clubs } = await admin.from("clubs").select("id, name, slug");
  if (!clubs?.length) return NextResponse.json({ sent: 0 });

  let totalSent = 0;

  for (const club of clubs) {
    // New listings this week
    const { data: newListings } = await admin
      .from("listings")
      .select("id, title, price, listing_type, images")
      .eq("club_id", club.id)
      .eq("is_sold", false)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!newListings?.length) continue;

    // Get approved members with auth users
    const { data: memberships } = await admin
      .from("memberships")
      .select("profile_id, profiles(auth_user_id, name)")
      .eq("club_id", club.id)
      .eq("status", "approved");

    if (!memberships?.length) continue;

    const safeClub = escapeHtml(club.name);
    const clubUrl = `${SITE_URL}/klubb/${club.slug}`;

    const listItems = newListings.map((l) => {
      const price = l.listing_type === "gi_bort" ? "Gratis" : `${l.price.toLocaleString("nb-NO")} kr`;
      return `<li style="margin-bottom:10px"><a href="${SITE_URL}/annonse/${l.id}" style="color:#1a3c2e;font-weight:600">${escapeHtml(l.title)}</a> <span style="color:#6b7280">— ${price}</span></li>`;
    }).join("\n");

    const html = buildEmail({
      heading: `Ukens utstyr fra ${safeClub}`,
      kicker: "Ukentlig oppdatering",
      body: `
        ${p(`Det har dukket opp <strong>${newListings.length} ${newListings.length === 1 ? "ny annonse" : "nye annonser"}</strong> fra ${safeClub} denne uken:`)}
        <ul style="padding-left:1.25rem;margin:16px 0;color:#374151">${listItems}</ul>
        ${p("Ikke gå glipp av en god deal — sjekk ut annonsene mens de er tilgjengelige.")}
      `,
      cta: { href: clubUrl, label: `Se alle annonser fra ${safeClub}` },
      footerNote: `Du mottar denne ukentlige oppdateringen fordi du er medlem av ${safeClub} på Sportsbytte. Svar på denne e-posten for å avslutte varsler.`,
    });

    for (const m of memberships) {
      const profile = m.profiles as { auth_user_id: string | null; name: string } | null;
      if (!profile?.auth_user_id) continue;

      const { data: authData } = await admin.auth.admin.getUserById(profile.auth_user_id);
      const email = authData.user?.email;
      if (!email) continue;

      resend.emails.send({
        from: FROM,
        to: email,
        subject: `${newListings.length} nye annonser fra ${club.name} denne uken`,
        html,
      }).catch(() => {});

      totalSent++;
    }
  }

  return NextResponse.json({ sent: totalSent });
}
