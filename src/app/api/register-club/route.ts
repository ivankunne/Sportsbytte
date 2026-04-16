import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use service role if available, fall back to anon for local dev
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    clubName, sport, location, memberCount, orgNumber,
    firstName, lastName, email, phone, role,
    logoUrl, primaryColor, secondaryColor, description,
  } = body;

  // Save to Supabase first
  const { error: dbError } = await supabase.from("club_registrations").insert({
    club_name: clubName,
    sport: sport || null,
    location: location || null,
    member_count: memberCount || null,
    org_number: orgNumber || null,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    role: role || null,
    logo_url: logoUrl || null,
    primary_color: primaryColor || null,
    secondary_color: secondaryColor || null,
    description: description || null,
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const adminUrl = `${req.nextUrl.origin}/admin/registreringer`;

  // Then send email notification
  const { error } = await resend.emails.send({
    from: "Sportsbyttet <onboarding@resend.dev>",
    to: "ivan@frameflow.no",
    subject: `Ny klubbregistrering: ${clubName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: ${primaryColor || "#1a3c2e"}; padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Ny klubbregistrering</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Mottatt via sportsbyttet.no</p>
        </div>

        <div style="background: #f9f7f4; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e0d8; border-top: none;">

          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 0 0 16px;">Om klubben</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px; width: 40%;">Klubbnavn</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">${clubName || "—"}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">Idrett</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">${sport || "—"}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">Sted</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">${location || "—"}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">Antall medlemmer</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">${memberCount || "—"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Org.nummer</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${orgNumber || "—"}</td></tr>
          </table>

          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 0 0 16px;">Kontaktperson</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px; width: 40%;">Navn</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">${firstName || ""} ${lastName || ""}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">E-post</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;"><a href="mailto:${email}" style="color: #1a3c2e;">${email || "—"}</a></td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">Telefon</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">${phone || "—"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Rolle</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${role || "—"}</td></tr>
          </table>

          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 0 0 16px;">Tilpasning</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px; width: 40%;">Primærfarge</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">
                <span style="display: inline-block; width: 14px; height: 14px; border-radius: 3px; background: ${primaryColor || "#1a3c2e"}; margin-right: 6px; vertical-align: middle;"></span>
                ${primaryColor || "—"}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">Sekundærfarge</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px; font-weight: 600;">
                ${secondaryColor
                  ? `<span style="display: inline-block; width: 14px; height: 14px; border-radius: 3px; background: ${secondaryColor}; margin-right: 6px; vertical-align: middle;"></span>${secondaryColor}`
                  : "—"
                }
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; color: #666; font-size: 14px;">Logo</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e0d8; font-size: 14px;">
                ${logoUrl ? `<a href="${logoUrl}" style="color: #1a3c2e;">Se logo</a>` : "—"}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px; vertical-align: top;">Beskrivelse</td>
              <td style="padding: 8px 0; font-size: 14px;">${description || "—"}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${adminUrl}" style="display: inline-block; background: #1a3c2e; color: white; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
              Se søknaden i innboksen →
            </a>
          </div>

          <p style="font-size: 12px; color: #aaa; margin: 0;">Sendt fra sportsbyttet.no · ${new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
