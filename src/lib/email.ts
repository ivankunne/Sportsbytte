// Nordic Teal email template — matches site palette exactly

/** Escape user-supplied strings before interpolating into HTML email bodies */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const T900 = "#134e4a"; // header bg
const T600 = "#0d9488"; // primary / kicker / link
const T50  = "#f0fdfa"; // highlight box bg
const T200 = "#99f6e4"; // highlight box border
const INK  = "#1c1917"; // heading
const BODY = "#4b5563"; // body text
const MUTED = "#9ca3af"; // footer text
const BORDER = "#e5e7eb";
const CANVAS = "#f9fafb";
const WHITE  = "#ffffff";

export const FROM = "Sportsbytte <hei@frameflow.no>";
export const ADMIN_EMAIL = "ivan@frameflow.no";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsbytte.no";

interface BuildEmailOptions {
  heading: string;
  kicker?: string;
  body: string;               // inner HTML — use infoBox(), p(), etc.
  cta?: { href: string; label: string };
  footerNote?: string;
}

export function buildEmail({ heading, kicker, body, cta, footerNote }: BuildEmailOptions): string {
  const date = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  const ctaHtml = cta
    ? `<div style="text-align:center;margin:28px 0 4px;">
        <a href="${cta.href}" style="display:inline-block;background:${T600};color:${WHITE};text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;letter-spacing:-0.1px;">
          ${cta.label} →
        </a>
       </div>`
    : "";

  const kickerHtml = kicker
    ? `<p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${T600};">${kicker}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CANVAS};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;">

        <!-- Header -->
        <tr>
          <td style="background:${T900};padding:20px 28px;border-radius:14px 14px 0 0;">
            <span style="font-size:17px;font-weight:800;color:${WHITE};letter-spacing:-0.4px;">Sportsbytte</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:${WHITE};padding:32px 28px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
            ${kickerHtml}
            <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${INK};letter-spacing:-0.4px;line-height:1.3;">${heading}</h1>
            <div style="font-size:15px;color:${BODY};line-height:1.65;">
              ${body}
            </div>
            ${ctaHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${CANVAS};padding:16px 28px;border:1px solid ${BORDER};border-top:none;border-radius:0 0 14px 14px;">
            <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;">
              ${footerNote ?? "Du mottar denne e-posten fra Sportsbytte."}<br>
              <a href="${SITE_URL}" style="color:${T600};text-decoration:none;">sportsbytte.no</a> · Driftes av Frameflow / Ivan Kunne · ${date}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/** Teal-tinted highlight box — use for message previews, key info */
export function infoBox(content: string, label?: string): string {
  return `
    <div style="background:${T50};border:1px solid ${T200};border-radius:10px;padding:16px 18px;margin:20px 0;">
      ${label ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${T600};">${label}</p>` : ""}
      <p style="margin:0;font-size:14px;color:${INK};line-height:1.65;white-space:pre-wrap;">${content}</p>
    </div>`;
}

/** Simple paragraph */
export function p(text: string): string {
  return `<p style="margin:0 0 16px;">${text}</p>`;
}

/** Key-value detail row */
export function detail(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${MUTED};width:40%;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:13px;color:${INK};font-weight:600;">${value || "—"}</td>
    </tr>`;
}

/** Wraps detail() rows in a table */
export function detailTable(rows: string): string {
  return `<table width="100%" style="border-collapse:collapse;margin:0 0 24px;">${rows}</table>`;
}

/** Section label above a detail table */
export function sectionLabel(text: string): string {
  return `<p style="margin:24px 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${MUTED};">${text}</p>`;
}
