import Stripe from "stripe";

// ─── Change this one number to adjust your platform cut ───
export const PLATFORM_FEE_PERCENT = 5;
// ──────────────────────────────────────────────────────────

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/** Platform fee in øre (Stripe uses smallest currency unit) */
export function platformFee(priceNok: number): number {
  return Math.round(priceNok * PLATFORM_FEE_PERCENT);
}
