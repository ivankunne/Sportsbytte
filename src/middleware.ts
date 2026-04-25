import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_ROUTES = [
  "/api/admin/action",
  "/api/approve-club",
];

const BEARER_ROUTES = [
  "/api/create-listing",
  "/api/reviews",
  "/api/notify-welcome",
  "/api/inquiry",
  "/api/stripe/seller-pro-subscribe",
  "/api/stripe/seller-pro-cancel",
  "/api/stripe/boost-listing",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── API route auth checks (fast, no Supabase needed) ──────────────────────
  if (ADMIN_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
    }
    if (req.headers.get("x-admin-secret") !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (BEARER_ROUTES.some((r) => pathname.startsWith(r))) {
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/notify-listing")) {
    const hasSecret = req.headers.get("x-webhook-secret");
    if (!hasSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/notify-membership")) {
    const hasSecret = req.headers.get("x-webhook-secret");
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasSecret && !hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/api/revalidate")) {
    const hasAdminSecret = req.headers.get("x-admin-secret");
    const hasAuth = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasAdminSecret && !hasAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── Session refresh for page requests ─────────────────────────────────────
  // Refreshes the Supabase cookie-based session so the user stays logged in
  if (!pathname.startsWith("/api/")) {
    let res = NextResponse.next({ request: req });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              req.cookies.set(name, value)
            );
            res = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refreshes the session if expired — required for Server Components
    await supabase.auth.getUser();

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt)$).*)",
  ],
};
