import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { buildEmail, infoBox, p, escapeHtml, FROM, SITE_URL } from "@/lib/email";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "inquiry"), { limit: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen senere." }, { status: 429 });
  }

  // Require a valid Supabase session — buyer email always comes from the session
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { listing_id: number; message: string; listing_title?: string; seller_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { listing_id, message, listing_title, seller_name } = body;

  if (!listing_id || !message?.trim()) {
    return NextResponse.json(
      { error: "Mangler påkrevde felter: listing_id, message" },
      { status: 400 }
    );
  }

  // Resolve buyer name from verified profile — never trust client-supplied name
  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const buyerName = buyerProfile?.name ?? user.email.split("@")[0];
  const buyerEmail = user.email;

  const { error: dbError } = await admin.from("inquiries").insert({
    listing_id,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    message: message.trim(),
  });

  if (dbError) {
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }

  const listingUrl = `${SITE_URL}/annonse/${listing_id}`;
  const safeName = escapeHtml(buyerName);
  const safeTitle = listing_title ? escapeHtml(listing_title) : "annonsen";
  const safeSeller = seller_name ? escapeHtml(seller_name) : null;
  const safeMessage = escapeHtml(message.trim());

  const html = buildEmail({
    heading: "Henvendelsen din er sendt!",
    kicker: "Melding sendt",
    body: `
      ${p(`Hei ${safeName},`)}
      ${p(`Vi har videresendt meldingen din om <strong>${safeTitle}</strong>${safeSeller ? ` til ${safeSeller}` : ""}. Selgeren vil ta kontakt med deg så snart som mulig.`)}
      ${infoBox(safeMessage, "Din melding")}
    `,
    cta: { href: listingUrl, label: "Se annonsen" },
    footerNote: "Du mottar denne e-posten fordi du sendte en henvendelse på Sportsbytte.",
  });

  const { error: emailError } = await resend.emails.send({
    from: FROM,
    to: buyerEmail,
    subject: `Din henvendelse om "${listing_title ?? "annonsen"}" er sendt`,
    html,
  });

  if (emailError) {
    console.error("inquiry Resend error:", emailError.message);
  }

  return NextResponse.json({ ok: true });
}
