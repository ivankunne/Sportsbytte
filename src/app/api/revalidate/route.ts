import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const incomingSecret = req.headers.get("x-admin-secret");
  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  // Accept either a valid admin secret or a valid Supabase session
  let authorized = false;

  if (adminSecret && incomingSecret && incomingSecret === adminSecret) {
    authorized = true;
  } else if (bearerToken) {
    const { data: { user } } = await anonClient.auth.getUser(bearerToken);
    if (user) authorized = true;
  }

  if (!authorized) return unauthorized();

  let path: string;
  try {
    ({ path } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "Mangler path" }, { status: 400 });
  }

  // Only allow revalidating relative paths starting with /
  if (!path.startsWith("/")) {
    return NextResponse.json({ error: "Ugyldig path" }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true });
}
