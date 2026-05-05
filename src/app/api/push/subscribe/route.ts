import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const body = await req.json() as { subscription?: { endpoint: string; keys: { p256dh: string; auth: string } }; action?: string };

  if (body.action === "unsubscribe" && body.subscription?.endpoint) {
    await admin.from("push_subscriptions").delete().eq("endpoint", body.subscription.endpoint);
    return NextResponse.json({ ok: true });
  }

  if (!body.subscription?.endpoint || !body.subscription?.keys) {
    return NextResponse.json({ error: "Ugyldig subscription" }, { status: 400 });
  }

  await admin.from("push_subscriptions").upsert({
    profile_id: profile.id,
    endpoint: body.subscription.endpoint,
    p256dh: body.subscription.keys.p256dh,
    auth: body.subscription.keys.auth,
  }, { onConflict: "endpoint" });

  return NextResponse.json({ ok: true });
}
