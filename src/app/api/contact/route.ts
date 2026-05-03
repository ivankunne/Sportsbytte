import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { buildEmail, p, infoBox, escapeHtml, FROM, ADMIN_EMAIL } from "@/lib/email";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "contact"), { limit: 3, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen senere." }, { status: 429 });
  }
  let name: string, email: string, subject: string | undefined, message: string;
  try {
    ({ name, email, subject, message } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Manglende felt." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ugyldig e-postadresse." }, { status: 400 });
  }

  const safeName = escapeHtml(name.trim().slice(0, 120));
  const safeEmail = escapeHtml(email.trim().slice(0, 254));
  const safeSubject = subject ? escapeHtml(subject.trim().slice(0, 200)) : null;
  const safeMessage = escapeHtml(message.trim().slice(0, 5000));

  const html = buildEmail({
    heading: safeSubject ?? `Melding fra ${safeName}`,
    kicker: "Kontaktskjema",
    body: `
      ${p(`<strong>Fra:</strong> ${safeName} (<a href="mailto:${safeEmail}" style="color:#0d9488;">${safeEmail}</a>)`)}
      ${infoBox(safeMessage, "Melding")}
    `,
    footerNote: "Denne e-posten ble sendt via kontaktskjemaet på Sportsbytte.",
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email.trim(),
    subject: safeSubject ? `Kontaktskjema: ${safeSubject}` : `Kontaktskjema fra ${safeName}`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
