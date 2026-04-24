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

  // /api/create-listing requires at minimum an Authorization header (JWT verified in route handler)
  if (pathname.startsWith("/api/create-listing")) {
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // /api/revalidate requires either an admin secret or an Authorization header
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
    "/api/revalidate",
  ],
};
