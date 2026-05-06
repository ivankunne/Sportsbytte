import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildEmail, p, escapeHtml, FROM, SITE_URL } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clubName: string, inviteUrl: string, emails: string[];
  try {
    ({ clubName, inviteUrl, emails } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!clubName || !inviteUrl || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "Mangler clubName, inviteUrl eller emails" }, { status: 400 });
  }

  const safeClub = escapeHtml(clubName);
  const html = buildEmail({
    heading: `Du er invitert til ${safeClub}`,
    kicker: "Klubbinvitasjon",
    body: `
      ${p(`Du har fått en invitasjon til å bli med i <strong>${safeClub}</strong> på Sportsbytte — Norges markedsplass for brukt sportsutstyr.`)}
      ${p("Klikk på knappen under for å opprette konto og bli automatisk godkjent som klubbmedlem.")}
      ${p("Som klubbmedlem kan du kjøpe og selge brukt utstyr direkte med dine lagkamerater.")}
    `,
    cta: { href: inviteUrl, label: `Bli med i ${safeClub}` },
    footerNote: `Du har fått denne e-posten fordi en klubbadministrator i ${safeClub} har invitert deg til Sportsbytte. Hvis du ikke ønsker å bli med, kan du ignorere denne e-posten.`,
  });

  let sent = 0;
  const errors: string[] = [];

  for (const email of emails.slice(0, 200)) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) continue;
    const { error } = await resend.emails.send({
      from: FROM,
      to: trimmed,
      subject: `Invitasjon til ${clubName} på Sportsbytte`,
      html,
    });
    if (error) {
      errors.push(trimmed);
    } else {
      sent++;
    }
  }

  return NextResponse.json({ sent, errors });
}
