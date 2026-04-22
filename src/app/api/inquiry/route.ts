import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

const resend = new Resend(process.env.RESEND_API_KEY);

// Service role bypasses RLS — required for inserting into inquiries
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    listing_id,
    buyer_name,
    buyer_email,
    message,
    listing_title,
    seller_name,
  } = body;

  if (!listing_id || !buyer_name || !buyer_email || !message) {
    return NextResponse.json(
      { error: "Mangler påkrevde felter: listing_id, buyer_name, buyer_email, message" },
      { status: 400 }
    );
  }

  // 1. Save inquiry to database
  const { error: dbError } = await supabase.from("inquiries").insert({
    listing_id,
    buyer_name,
    buyer_email,
    message,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // 2. Send confirmation email to buyer
  const listingUrl = `${req.nextUrl.origin}/annonse/${listing_id}`;

  const { error: emailError } = await resend.emails.send({
    from: "Sportsbytte <onboarding@resend.dev>",
    to: buyer_email,
    subject: `Din henvendelse om "${listing_title}" er sendt`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #1a3c2e; padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Henvendelsen din er sendt!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">sportsbytte.no</p>
        </div>

        <div style="background: #f9f7f4; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e0d8; border-top: none;">

          <p style="font-size: 15px; margin: 0 0 20px; line-height: 1.6;">
            Hei ${buyer_name},
          </p>
          <p style="font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
            Vi har videresendt meldingen din om <strong>${listing_title}</strong>${seller_name ? ` til ${seller_name}` : ""}. Selgeren vil ta kontakt med deg direkte på e-post så snart som mulig.
          </p>

          <div style="background: white; border: 1px solid #e5e0d8; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
            <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 0 0 10px;">Din melding</p>
            <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.7; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${listingUrl}" style="display: inline-block; background: #1a3c2e; color: white; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
              Se annonsen →
            </a>
          </div>

          <p style="font-size: 14px; color: #555; margin: 0 0 4px; line-height: 1.6;">
            Med vennlig hilsen,<br/>
            <strong>Sportsbytte-teamet</strong>
          </p>

          <p style="font-size: 12px; color: #aaa; margin: 24px 0 0;">Sendt fra sportsbytte.no · ${new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    `,
  });

  if (emailError) {
    // DB insert succeeded — log the email error but don't fail the request
    console.error("Resend email error:", emailError.message);
  }

  return NextResponse.json({ ok: true });
}
