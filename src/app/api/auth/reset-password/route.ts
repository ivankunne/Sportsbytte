import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildEmail, p, FROM, SITE_URL } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let email: string;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Ugyldig e-postadresse" }, { status: 400 });
  }

  // Generate a recovery link — silently no-op if user doesn't exist (no user enumeration)
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: email.trim(),
    options: { redirectTo: `${SITE_URL}/tilbakestill-passord` },
  });

  if (error || !data?.properties?.action_link) {
    // Always return success — don't reveal whether email exists
    return NextResponse.json({ ok: true });
  }

  const html = buildEmail({
    heading: "Tilbakestill passordet ditt",
    kicker: "Sikkerhetslenke",
    body: `
      ${p("Vi mottok en forespørsel om å tilbakestille passordet for kontoen din på Sportsbytte.")}
      ${p("Klikk på knappen under for å velge et nytt passord. Lenken er gyldig i <strong>1 time</strong>.")}
      ${p("Hvis du ikke ba om dette, kan du trygt ignorere denne e-posten — ingenting skjer.")}
    `,
    cta: { href: data.properties.action_link, label: "Tilbakestill passord" },
    footerNote: "Du mottar denne e-posten fordi noen ba om å tilbakestille passordet for denne kontoen på Sportsbytte.",
  });

  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: email.trim(),
    subject: "Tilbakestill passordet ditt — Sportsbytte",
    html,
  });

  if (sendError) console.error("reset-password Resend error:", sendError);

  return NextResponse.json({ ok: true });
}
