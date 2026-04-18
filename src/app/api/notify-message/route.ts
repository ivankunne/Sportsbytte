import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

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

  const messageSnippet =
    record.type === "vipps_request"
      ? "Sendte en Vipps-betalingsforespørsel"
      : record.type === "bring_request"
      ? "Sendte en Bring-fraktforespørsel"
      : record.content.length > 200
      ? record.content.slice(0, 197) + "..."
      : record.content;

  const { error } = await resend.emails.send({
    from: "Sportsbyttet <meldinger@sportsbyttet.no>",
    to: toEmail,
    subject,
    html: `
<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e3db;">
        <!-- Header -->
        <tr>
          <td style="background:#1a3a2a;padding:20px 28px;">
            <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px;">Sportsbyttet</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Ny melding</p>
            <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111;">${subject}</h1>

            <!-- Message bubble -->
            <div style="background:#f5f4f0;border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;font-size:15px;color:#333;line-height:1.6;white-space:pre-wrap;">${messageSnippet}</p>
            </div>

            <a href="${listingUrl}" style="display:inline-block;background:#1a3a2a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
              Åpne samtalen →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #e5e3db;">
            <p style="margin:0;font-size:12px;color:#aaa;">Du mottar denne e-posten fordi du har en aktiv samtale på Sportsbyttet. Driftes av Frameflow / Ivan Kunne.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to: toEmail });
}
