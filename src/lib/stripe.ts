import Stripe from "stripe";

// ─── Change these numbers to adjust your platform cut ─────
export const PLATFORM_FEE_PERCENT = 5; // standard clubs
export const PRO_FEE_PERCENT = 2;      // Pro clubs
// ──────────────────────────────────────────────────────────

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/** Platform fee in øre (Stripe uses smallest currency unit) */
export function platformFee(priceNok: number, isPro = false): number {
  const pct = isPro ? PRO_FEE_PERCENT : PLATFORM_FEE_PERCENT;
  return Math.round(priceNok * pct);
}
