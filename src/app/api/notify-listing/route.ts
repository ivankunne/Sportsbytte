import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { buildEmail, infoBox, p, escapeHtml, FROM, SITE_URL } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Server-to-server only — must supply the shared webhook secret
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let type: "published" | "sold", listing_id: number;
  try {
    ({ type, listing_id } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!type || !listing_id) {
    return NextResponse.json({ error: "Missing type or listing_id" }, { status: 400 });
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, title, price, category, condition, seller_id, clubs(name), profiles(name, auth_user_id)")
    .eq("id", listing_id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const profile = listing.profiles as { name: string; auth_user_id: string } | null;
  if (!profile?.auth_user_id) return NextResponse.json({ ok: true, skipped: "no seller profile" });

  const { data: authUser } = await admin.auth.admin.getUserById(profile.auth_user_id);
  const sellerEmail = authUser.user?.email;
  if (!sellerEmail) return NextResponse.json({ ok: true, skipped: "no seller email" });

  const club = listing.clubs as { name: string } | null;
  const listingUrl = `${SITE_URL}/annonse/${listing_id}`;
  const price = listing.price.toLocaleString("nb-NO");

  // Escape DB values — they originate from user input
  const safeTitle = escapeHtml(listing.title);
  const safeName = escapeHtml(profile.name);
  const safeClub = club ? escapeHtml(club.name) : null;

  let subject: string;
  let html: string;

  if (type === "published") {
    subject = `Annonsen din er publisert: ${listing.title}`;
    html = buildEmail({
      heading: "Annonsen er live!",
      kicker: "Annonse publisert",
      body: `
        ${p(`Hei ${safeName},`)}
        ${p("Annonsen din er nå synlig på Sportsbytte. Andre klubbmedlemmer kan nå finne og kjøpe utstyret ditt.")}
        ${infoBox(`${safeTitle}\n${price} kr · ${listing.condition}${safeClub ? ` · ${safeClub}` : ""}`, "Din annonse")}
        ${p("Du vil få en e-post når noen sender deg en melding om annonsen.")}
      `,
      cta: { href: listingUrl, label: "Se annonsen din" },
      footerNote: "Du mottar denne e-posten fordi du publiserte en annonse på Sportsbytte.",
    });
  } else {
    subject = `Annonsen din er merket som solgt: ${listing.title}`;
    html = buildEmail({
      heading: "Gratulerer med salget!",
      kicker: "Solgt",
      body: `
        ${p(`Hei ${safeName},`)}
        ${p(`Annonsen din for <strong>${safeTitle}</strong> er merket som solgt. Bra jobbet!`)}
        ${infoBox(`${safeTitle}\n${price} kr · ${listing.condition}`, "Solgt annonse")}
        ${p("Har du mer utstyr som samler støv? Legg ut en ny annonse og gi det nytt liv.")}
      `,
      cta: { href: `${SITE_URL}/selg`, label: "Legg ut ny annonse" },
      footerNote: "Du mottar denne e-posten fordi en annonse din er merket som solgt på Sportsbytte.",
    });
  }

  const { error } = await resend.emails.send({ from: FROM, to: sellerEmail, subject, html });
  if (error) {
    console.error("notify-listing Resend error:", error);
    return NextResponse.json({ error: "Intern feil" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
