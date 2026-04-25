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

// Vercel calls cron endpoints with GET + Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: searches } = await admin.from("saved_searches").select("*");
  if (!searches?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const search of searches) {
    let q = admin
      .from("listings")
      .select("id, title, price, category")
      .eq("is_sold", false)
      .gte("created_at", since);

    if (search.keywords?.trim()) {
      const pat = `%${search.keywords.trim()}%`;
      q = q.or(`title.ilike.${pat},description.ilike.${pat}`);
    }
    if (search.category) q = q.ilike("category", `%${search.category}%`);
    if (search.max_price !== null) q = q.lte("price", search.max_price);
    if (search.club_id) q = q.eq("club_id", search.club_id);

    const { data: matches } = await q.limit(10);
    if (!matches?.length) continue;

    const searchLabel = [
      search.keywords && `"${escapeHtml(search.keywords)}"`,
      search.category && escapeHtml(search.category),
      search.max_price !== null && `maks ${search.max_price.toLocaleString("nb-NO")} kr`,
    ].filter(Boolean).join(", ") || "alle annonser";

    const listItems = matches
      .map(
        (l) =>
          `<li style="margin-bottom:8px"><a href="${SITE_URL}/annonse/${l.id}" style="color:#1a3c2e;font-weight:600">${escapeHtml(l.title)}</a> <span style="color:#6b7280">— ${l.price.toLocaleString("nb-NO")} kr</span></li>`
      )
      .join("\n");

    const html = buildEmail({
      heading: `${matches.length} nye ${matches.length === 1 ? "annonse" : "annonser"} matcher søket ditt`,
      kicker: "Varsel for lagret søk",
      body: `
        ${p(`Vi fant ${matches.length} ${matches.length === 1 ? "ny annonse" : "nye annonser"} som matcher: ${searchLabel}`)}
        <ul style="padding-left:1.25rem;margin:16px 0;color:#374151">${listItems}</ul>
      `,
      cta: { href: `${SITE_URL}/utforsk`, label: "Se alle annonser" },
      footerNote: "Du mottar denne e-posten fordi du lagret et søk på Sportsbytte. Svar på denne e-posten for å avslutte varsler.",
    });

    resend.emails.send({
      from: FROM,
      to: search.notify_email,
      subject: `${matches.length} nye treff: ${search.keywords ?? search.category ?? "Sportsbytte"}`,
      html,
    }).catch(() => {});

    sent++;
  }

  return NextResponse.json({ sent });
}
