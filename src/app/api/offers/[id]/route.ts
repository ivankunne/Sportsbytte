import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import { sendPushToProfile } from "@/lib/push";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles").select("id, name").eq("auth_user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profil ikke funnet" }, { status: 404 });

  const { data: offer } = await admin
    .from("offers")
    .select("*, listings(title)")
    .eq("id", Number(id))
    .maybeSingle();
  if (!offer) return NextResponse.json({ error: "Tilbud ikke funnet" }, { status: 404 });

  const isSeller = offer.seller_profile_id === profile.id;
  const isBuyer = offer.buyer_profile_id === profile.id;
  if (!isSeller && !isBuyer) return NextResponse.json({ error: "Ikke tilgang" }, { status: 403 });

  const body = await req.json() as { action: "accept" | "decline" | "counter" | "retract"; counter_amount?: number };
  const { action, counter_amount } = body;

  const listingTitle = (offer.listings as { title: string } | null)?.title ?? "utstyr";

  if (action === "accept" && isSeller) {
    await admin.from("offers").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", offer.id);
    await sendPushToProfile(offer.buyer_profile_id, {
      title: "Bud akseptert!",
      body: `Selgeren aksepterte budet ditt på ${offer.amount.toLocaleString("nb-NO")} kr for "${listingTitle}"`,
      url: `/annonse/${offer.listing_id}`,
    });
  } else if (action === "decline" && isSeller) {
    await admin.from("offers").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", offer.id);
    await sendPushToProfile(offer.buyer_profile_id, {
      title: "Bud avslått",
      body: `Selgeren avslo budet ditt på "${listingTitle}"`,
      url: `/annonse/${offer.listing_id}`,
    });
  } else if (action === "counter" && isSeller && counter_amount && counter_amount > 0) {
    await admin.from("offers").update({
      status: "countered",
      counter_amount,
      updated_at: new Date().toISOString(),
    }).eq("id", offer.id);
    await sendPushToProfile(offer.buyer_profile_id, {
      title: "Motbud mottatt",
      body: `Selgeren vil ha ${counter_amount.toLocaleString("nb-NO")} kr for "${listingTitle}"`,
      url: "/dashboard?tab=tilbud",
    });
  } else if (action === "retract" && isBuyer) {
    await admin.from("offers").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", offer.id);
  } else {
    return NextResponse.json({ error: "Ugyldig handling" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
