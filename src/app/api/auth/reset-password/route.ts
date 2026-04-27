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

// Simple in-memory rate limiter: max 5 attempts per IP per 15 minutes
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    ipAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "For mange forsøk. Vent 15 minutter og prøv igjen." },
      { status: 429 }
    );
  }

  let email: string;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Ugyldig e-postadresse" }, { status: 400 });
  }

  // generateLink generates the recovery link but does NOT send the email —
  // we send it ourselves via Resend with the branded template.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: email.trim(),
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: "Ingen konto funnet med denne e-postadressen." },
      { status: 404 }
    );
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

  if (sendError) {
    console.error("reset-password Resend error:", sendError);
    return NextResponse.json(
      { error: "Kunne ikke sende e-post. Prøv igjen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
