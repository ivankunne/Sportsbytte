import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";

  const state = Buffer.from(
    JSON.stringify({ nonce: crypto.randomBytes(16).toString("hex"), returnTo })
  ).toString("base64url");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.VIPPS_LOGIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/vipps/callback`,
    scope: "openid name phoneNumber email",
    state,
  });

  return NextResponse.redirect(
    `https://api.vipps.no/access-management-1.0/access/oauth2/auth?${params}`
  );
}
