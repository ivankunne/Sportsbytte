import { NextRequest, NextResponse } from "next/server";

// Routes that require a valid x-admin-secret header
const ADMIN_API_ROUTES = [
  "/api/admin/action",
  "/api/approve-club",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      // Fail closed — if the secret isn't configured, block everything
      return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
    }
    if (req.headers.get("x-admin-secret") !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Bearer-only routes — JWT verified in route handler
  const BEARER_ROUTES = [
    "/api/create-listing",
    "/api/reviews",
    "/api/notify-welcome",
    "/api/inquiry",
  ];
  if (BEARER_ROUTES.some((r) => pathname.startsWith(r))) {
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Webhook-secret-only routes
  if (pathname.startsWith("/api/notify-listing")) {
    const hasSecret = req.headers.get("x-webhook-secret");
    if (!hasSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // notify-membership accepts either Bearer or webhook secret
  if (pathname.startsWith("/api/notify-membership")) {
    const hasSecret = req.headers.get("x-webhook-secret");
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasSecret && !hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // /api/revalidate requires either an admin secret or a Bearer token
  if (pathname.startsWith("/api/revalidate")) {
    const hasAdminSecret = req.headers.get("x-admin-secret");
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasAdminSecret && !hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/approve-club",
    "/api/create-listing",
    "/api/reviews",
    "/api/notify-welcome",
    "/api/notify-listing",
    "/api/notify-membership",
    "/api/inquiry",
    "/api/revalidate",
  ],
};
