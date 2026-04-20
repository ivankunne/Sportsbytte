import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profile_id, rating, text, author_name } = body as {
    profile_id: number;
    rating: number;
    text?: string;
    author_name: string;
  };

  if (!profile_id || !rating || !author_name?.trim()) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Vurdering må være mellom 1 og 5" }, { status: 400 });
  }

  const { error } = await admin.from("reviews").insert({
    profile_id,
    rating,
    text: text?.trim() ?? "",
    author_name: author_name.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate and store average rating on the profile
  const { data: allReviews } = await admin
    .from("reviews")
    .select("rating")
    .eq("profile_id", profile_id);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await admin
      .from("profiles")
      .update({ rating: Math.round(avg * 10) / 10 })
      .eq("id", profile_id);
  }

  return NextResponse.json({ ok: true });
}
