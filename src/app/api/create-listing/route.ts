import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { SITE_URL } from "@/lib/email";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_COLUMNS = [
  "title", "description", "category", "condition", "price",
  "images", "specs", "club_id", "listing_type", "members_only",
  "quantity", "size_range", "is_sold", "delivery_method",
] as const;

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "create-listing"), { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen senere." }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const filtered: Record<string, unknown> = { seller_id: profile.id };
  for (const col of ALLOWED_COLUMNS) {
    if (col in body) filtered[col] = body[col];
  }

  // Server-side validation
  const title = typeof filtered.title === "string" ? filtered.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Tittel er påkrevd" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "Tittel kan ikke overstige 200 tegn" }, { status: 400 });

  const desc = typeof filtered.description === "string" ? filtered.description : "";
  if (desc.length > 5000) return NextResponse.json({ error: "Beskrivelse kan ikke overstige 5000 tegn" }, { status: 400 });

  const price = filtered.price;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return NextResponse.json({ error: "Ugyldig pris (0–1 000 000 kr)" }, { status: 400 });
  }

  const qty = filtered.quantity;
  if (qty !== undefined && qty !== null) {
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 9999) {
      return NextResponse.json({ error: "Antall må være mellom 1 og 9999" }, { status: 400 });
    }
  }

  const images = filtered.images;
  if (images !== undefined && (!Array.isArray(images) || images.length > 10)) {
    return NextResponse.json({ error: "Maks 10 bilder" }, { status: 400 });
  }

  filtered.title = title;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from("listings")
    .insert(filtered as any)
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

  if (filtered.club_id) {
    const { data: club } = await supabase
      .from("clubs")
      .select("active_listings")
      .eq("id", filtered.club_id as number)
      .maybeSingle();
    if (club) {
      await supabase
        .from("clubs")
        .update({ active_listings: club.active_listings + 1 })
        .eq("id", filtered.club_id as number);
    }
  }

  fetch(`${SITE_URL}/api/notify-listing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": process.env.NOTIFY_WEBHOOK_SECRET ?? "",
    },
    body: JSON.stringify({ type: "published", listing_id: data.id }),
  }).catch(() => {});

  return NextResponse.json({ id: data.id });
}
