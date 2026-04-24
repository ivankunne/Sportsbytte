import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { buildEmail, infoBox, p, escapeHtml, FROM } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

// Service-role client — never exposed to the browser
const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Verify the shared secret Supabase sends as a custom header
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const record = body.record as {
    id: string;
    conversation_id: string;
    is_from_seller: boolean;
    type: string;
    content: string;
  };

  if (!record?.conversation_id) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Fetch conversation + listing title
  const { data: conv } = await adminSupabase
    .from("conversations")
    .select("buyer_name, buyer_email, listing_id, seller_id")
    .eq("id", record.conversation_id)
    .single();

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: listing } = await adminSupabase
    .from("listings")
    .select("title, id")
    .eq("id", conv.listing_id)
    .single();

  const listingTitle = listing?.title ?? "en annonse";
  const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/annonse/${conv.listing_id}`;

  let toEmail: string;
  let toName: string;
  let subject: string;
  let previewText: string;

  if (record.is_from_seller) {
    // Seller replied → notify buyer
    toEmail = conv.buyer_email;
    toName = conv.buyer_name;
    subject = `Selgeren svarte på "${listingTitle}"`;
    previewText = `Du har fått svar på din melding om ${listingTitle}.`;
  } else {
    // Buyer sent a message → notify seller
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("auth_user_id, name")
      .eq("id", conv.seller_id)
      .single();

    if (!profile?.auth_user_id) {
      return NextResponse.json({ ok: true, skipped: "no seller auth" });
    }

    const { data: authUser } = await adminSupabase.auth.admin.getUserById(
      profile.auth_user_id
    );

    if (!authUser.user?.email) {
      return NextResponse.json({ ok: true, skipped: "no seller email" });
    }

    toEmail = authUser.user.email;
    toName = profile.name;
    subject = `${conv.buyer_name} sendte en melding om "${listingTitle}"`;
    previewText = `Ny melding på annonsen din: ${listingTitle}.`;
  }

  const rawSnippet =
    record.type === "vipps_request"
      ? "Sendte en Vipps-betalingsforespørsel"
      : record.type === "bring_request"
      ? "Sendte en Bring-fraktforespørsel"
      : record.content.length > 200
      ? record.content.slice(0, 197) + "..."
      : record.content;

  const messageSnippet = escapeHtml(rawSnippet);
  const safeToName = escapeHtml(toName);

  const html = buildEmail({
    heading: subject,
    kicker: "Ny melding",
    body: `
      ${p(`Hei ${safeToName},`)}
      ${infoBox(messageSnippet)}
    `,
    cta: { href: listingUrl, label: "Åpne samtalen" },
    footerNote: "Du mottar denne e-posten fordi du har en aktiv samtale på Sportsbytte.",
  });

  const { error } = await resend.emails.send({ from: FROM, to: toEmail, subject, html });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to: toEmail });
}
