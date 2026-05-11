import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Database } from "@/lib/database.types";
import { createPayment, platformFeeNok } from "@/lib/vipps";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Per-user rate limit: max 5 checkout attempts per minute (per serverless instance).
const checkoutAttempts = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = checkoutAttempts.get(userId);
  if (!entry || now > entry.resetAt) {
    checkoutAttempts.set(userId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "For mange forsøk. Prøv igjen om litt." }, { status: 429 });
  }

  let listing_id: number;
  try {
    ({ listing_id } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, title, price, is_sold, seller_id, images, members_only, club_id, quantity, clubs(is_pro), profiles(id, is_pro)")
    .eq("id", listing_id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Annonse ikke funnet" }, { status: 404 });
  if (listing.is_sold) return NextResponse.json({ error: "Annonsen er allerede solgt" }, { status: 400 });
  if (listing.quantity !== null && listing.quantity <= 0) return NextResponse.json({ error: "Annonsen er utsolgt" }, { status: 400 });

  const seller = listing.profiles as { id: number; is_pro?: boolean } | null;
  const clubIsPro = (listing.clubs as { is_pro: boolean } | null)?.is_pro ?? false;
  const isPro = clubIsPro || (seller?.is_pro ?? false);

  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (buyerProfile?.id === seller?.id) {
    return NextResponse.json({ error: "Du kan ikke kjøpe din egen annonse" }, { status: 400 });
  }

  if (listing.members_only && listing.club_id && buyerProfile) {
    const { data: membership } = await admin
      .from("memberships")
      .select("status")
      .eq("club_id", listing.club_id)
      .eq("profile_id", buyerProfile.id)
      .eq("status", "approved")
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "members_only" }, { status: 403 });
    }
  }

  // Prevent duplicate active checkout for same buyer+listing
  if (buyerProfile) {
    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_profile_id", buyerProfile.id)
      .in("status", ["pending", "pending_confirmation"])
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Du har allerede en aktiv betaling for denne annonsen. Sjekk kjøpshistorikken din." },
        { status: 409 }
      );
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const callbackSecret = process.env.VIPPS_CALLBACK_SECRET ?? "";
  const feeNok = platformFeeNok(listing.price, isPro);
  const totalNok = listing.price + feeNok;
  const reference = randomUUID();

  if (buyerProfile) {
    await admin.from("transactions").insert({
      listing_id: listing.id,
      buyer_profile_id: buyerProfile.id,
      seller_profile_id: listing.seller_id,
      amount: listing.price,
      vipps_reference: reference,
      provider: "vipps",
      status: "pending",
      release_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const payment = await createPayment({
    reference,
    totalNok,
    description: listing.title,
    returnUrl: `${siteUrl}/vipps/success?reference=${reference}&listing_id=${listing.id}`,
    // Vipps sends this token as the Authorization header in callbacks — never exposed in URLs or logs
    callbackUrl: `${siteUrl}/api/vipps/callback`,
    callbackAuthorizationToken: callbackSecret,
  });

  return NextResponse.json({ url: payment.redirectUrl });
}
