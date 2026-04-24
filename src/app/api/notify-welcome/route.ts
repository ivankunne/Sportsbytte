import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { buildEmail, p, escapeHtml, FROM, SITE_URL } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  // Require a valid Supabase session — prevents phishing relay to arbitrary addresses
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name: string;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  // Email address always comes from the verified session, never from the request body
  const email = user.email;
  const safeName = escapeHtml((name ?? email.split("@")[0]).trim().slice(0, 120));

  const html = buildEmail({
    heading: `Velkommen til Sportsbytte, ${safeName}!`,
    kicker: "Konto opprettet",
    body: `
      ${p(`Hei ${safeName},`)}
      ${p("Kontoen din er klar. Sportsbytte er Norges markedsplass for brukt sportsutstyr — organisert rundt idrettsklubbene dine.")}
      ${p("Her er hva du kan gjøre nå:")}
      <ul style="margin:0 0 20px;padding-left:20px;line-height:2;">
        <li>Finn og bli med i din idrettsklubb</li>
        <li>Utforsk brukt utstyr fra klubbmedlemmer</li>
        <li>Legg ut utstyr du ikke lenger bruker</li>
        <li>Betal trygt med kort og send med Bring</li>
      </ul>
    `,
    cta: { href: `${SITE_URL}/klubber`, label: "Finn din klubb" },
    footerNote: "Du mottar denne e-posten fordi du nettopp opprettet en konto på Sportsbytte.",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Velkommen til Sportsbytte, ${safeName}!`,
    html,
  });

  if (error) console.error("notify-welcome Resend error:", error);

  return NextResponse.json({ ok: true });
}
