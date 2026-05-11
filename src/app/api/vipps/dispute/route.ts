import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { FROM } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Buyer reports a problem — freezes the transaction and notifies admin.
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let transactionId: number;
  let reason: string;
  try {
    ({ transaction_id: transactionId, reason } = await req.json());
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { data: tx } = await admin
    .from("transactions")
    .select("id, listing_id, buyer_profile_id, seller_profile_id, amount, status, provider")
    .eq("id", transactionId)
    .maybeSingle();

  if (!tx) return NextResponse.json({ error: "Transaksjon ikke funnet" }, { status: 404 });
  if (tx.provider !== "vipps") return NextResponse.json({ error: "Kun Vipps-transaksjoner" }, { status: 400 });
  if (tx.status !== "pending_confirmation") {
    return NextResponse.json({ error: "Kan ikke rapportere problem på denne transaksjonen" }, { status: 400 });
  }

  // Verify caller is the buyer
  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("id, name, auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (buyerProfile?.id !== tx.buyer_profile_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Mark as disputed — payment is frozen until admin resolves
  await admin.from("transactions").update({
    status: "disputed",
    disputed_at: new Date().toISOString(),
  }).eq("id", tx.id);

  const { data: listing } = await admin
    .from("listings")
    .select("title")
    .eq("id", tx.listing_id!)
    .maybeSingle();

  const { data: sellerProfile } = await admin
    .from("profiles")
    .select("name, auth_user_id")
    .eq("id", tx.seller_profile_id!)
    .maybeSingle();

  // Notify admin
  const adminEmail = process.env.ADMIN_EMAIL ?? "ivan@frameflow.no";
  const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/annonse/${tx.listing_id}`;
  resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[TVIST] Transaksjon #${tx.id} — ${listing?.title ?? "Ukjent annonse"}`,
    html: `
      <h2>Kjøper har rapportert et problem</h2>
      <p><strong>Transaksjon:</strong> #${tx.id}</p>
      <p><strong>Annonse:</strong> <a href="${listingUrl}">${listing?.title ?? tx.listing_id}</a></p>
      <p><strong>Kjøper:</strong> ${buyerProfile?.name ?? user.email} (ID ${tx.buyer_profile_id})</p>
      <p><strong>Selger:</strong> ${sellerProfile?.name ?? "Ukjent"} (ID ${tx.seller_profile_id})</p>
      <p><strong>Beløp holdt:</strong> ${tx.amount.toLocaleString("nb-NO")} kr</p>
      <p><strong>Begrunnelse fra kjøper:</strong></p>
      <blockquote>${reason ?? "Ingen begrunnelse oppgitt"}</blockquote>
      <p>Gå inn i Supabase og behandle tvisten manuelt (enten frigi til selger eller refunder kjøper).</p>
    `,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
