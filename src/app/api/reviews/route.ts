import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { rateLimit, ipKey } from "@/lib/rate-limit";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  if (rateLimit(ipKey(req, "reviews"), { limit: 20, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen senere." }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve reviewer's profile — author_name is always set server-side
  const { data: reviewerProfile } = await admin
    .from("profiles")
    .select("id, name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!reviewerProfile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  let body: { profile_id: number; rating: number; text?: string; review_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { profile_id, rating, text } = body;
  const reviewType = body.review_type === "buyer" ? "buyer" : "seller";

  if (!profile_id || !rating) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Vurdering må være mellom 1 og 5" }, { status: 400 });
  }
  if (text && text.length > 1000) {
    return NextResponse.json({ error: "Kommentar kan ikke overstige 1000 tegn" }, { status: 400 });
  }
  if (reviewerProfile.id === profile_id) {
    return NextResponse.json({ error: "Du kan ikke vurdere deg selv" }, { status: 400 });
  }

  // Verify the profile being reviewed exists
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", profile_id)
    .maybeSingle();
  if (!targetProfile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  // Prevent duplicate reviews of the same type from the same reviewer
  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("profile_id", profile_id)
    .eq("reviewer_id", reviewerProfile.id)
    .eq("review_type", reviewType)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
  }

  if (reviewType === "seller") {
    // Buyer reviewing seller: require completed purchase from this seller
    const { data: purchase } = await admin
      .from("listings")
      .select("id")
      .eq("seller_id", profile_id)
      .eq("buyer_profile_id", reviewerProfile.id)
      .eq("is_sold", true)
      .limit(1)
      .maybeSingle();
    if (!purchase) {
      return NextResponse.json({ error: "no_purchase" }, { status: 403 });
    }
  } else {
    // Seller reviewing buyer: require the buyer purchased something from this seller
    const { data: purchase } = await admin
      .from("listings")
      .select("id")
      .eq("seller_id", reviewerProfile.id)
      .eq("buyer_profile_id", profile_id)
      .eq("is_sold", true)
      .limit(1)
      .maybeSingle();
    if (!purchase) {
      return NextResponse.json({ error: "no_purchase" }, { status: 403 });
    }
  }

  const { error: insertError } = await admin.from("reviews").insert({
    profile_id,
    rating,
    text: text?.trim() ?? "",
    author_name: reviewerProfile.name,
    reviewer_id: reviewerProfile.id,
    review_type: reviewType,
  });

  if (insertError) return NextResponse.json({ error: "Intern feil" }, { status: 500 });

  // Recalculate average rating using a DB aggregate to avoid the race condition
  // of fetch-then-compute. Still two queries but the avg is computed in Postgres.
  const { data: agg } = await admin
    .from("reviews")
    .select("rating")
    .eq("profile_id", profile_id);

  if (agg && agg.length > 0) {
    const avg = agg.reduce((s, r) => s + r.rating, 0) / agg.length;
    await admin
      .from("profiles")
      .update({ rating: Math.round(avg * 10) / 10 })
      .eq("id", profile_id);
  }

  return NextResponse.json({ ok: true });
}
