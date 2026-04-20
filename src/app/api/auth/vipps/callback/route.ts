import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL!;
const REDIRECT_URI = `${SITE}/api/auth/vipps/callback`;

function errorRedirect(reason: string) {
  return NextResponse.redirect(`${SITE}/?vipps_error=${reason}`);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code) return errorRedirect("no_code");

  // Decode returnTo from state
  let returnTo = "/";
  try {
    const parsed = JSON.parse(Buffer.from(state ?? "", "base64url").toString());
    returnTo = parsed.returnTo ?? "/";
  } catch {}

  // Exchange code for access token
  const credentials = Buffer.from(
    `${process.env.VIPPS_LOGIN_CLIENT_ID}:${process.env.VIPPS_LOGIN_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(
    "https://api.vipps.no/access-management-1.0/access/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    }
  );

  if (!tokenRes.ok) return errorRedirect("token_exchange");
  const { access_token } = await tokenRes.json();

  // Get user info from Vipps
  const userInfoRes = await fetch(
    "https://api.vipps.no/vipps-userinfo-api/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (!userInfoRes.ok) return errorRedirect("userinfo");
  const vippsUser = await userInfoRes.json();

  const email: string | undefined = vippsUser.email;
  const name: string = vippsUser.name ?? vippsUser.given_name ?? "Vipps-bruker";
  const phone: string | undefined = vippsUser.phone_number;

  if (!email) return errorRedirect("no_email");

  // generateLink creates the user if they don't exist yet, and returns a sign-in link
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${SITE}${returnTo}` },
  });

  if (linkError || !linkData?.properties?.action_link) return errorRedirect("generate_link");

  const userId = linkData.user.id;

  // Ensure profile exists
  const { data: existingProfile } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (!existingProfile) {
    const slug =
      name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString(36);

    await adminSupabase.from("profiles").insert({
      auth_user_id: userId,
      name,
      slug,
      vipps_phone: phone ?? null,
    });
  } else if (phone) {
    // Keep Vipps phone up to date
    await adminSupabase
      .from("profiles")
      .update({ vipps_phone: phone })
      .eq("auth_user_id", userId);
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
