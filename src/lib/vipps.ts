// ─── Vipps API client ─────────────────────────────────────
// Required env vars (set these when Vipps credentials are ready):
//   VIPPS_CLIENT_ID
//   VIPPS_CLIENT_SECRET
//   VIPPS_SUBSCRIPTION_KEY
//   VIPPS_MERCHANT_SERIAL_NUMBER
//   VIPPS_CALLBACK_SECRET        (any secret string you choose)
//   VIPPS_TEST_MODE=true         (omit or set false for production)

export const PLATFORM_FEE_PERCENT = 5;
export const PRO_FEE_PERCENT = 2;

/** Platform fee in NOK (whole kroner, for display). */
export function platformFeeNok(priceNok: number, isPro = false): number {
  const pct = isPro ? PRO_FEE_PERCENT : PLATFORM_FEE_PERCENT;
  return Math.round(priceNok * pct) / 100;
}

/** Seller payout amount in NOK (listing price, no deduction — fee is on buyer). */
export function sellerPayoutNok(priceNok: number): number {
  return priceNok;
}

const BASE_URL = process.env.VIPPS_TEST_MODE === "true"
  ? "https://apitest.vipps.no"
  : "https://api.vipps.no";

const MSN = () => process.env.VIPPS_MERCHANT_SERIAL_NUMBER!;
const SUB_KEY = () => process.env.VIPPS_SUBSCRIPTION_KEY!;

// ─── Access token (cached in memory) ──────────────────────
let _token: string | null = null;
let _tokenExpiry = 0;

export async function getAccessToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch(`${BASE_URL}/accesstoken/get`, {
    method: "POST",
    headers: {
      "client_id": process.env.VIPPS_CLIENT_ID!,
      "client_secret": process.env.VIPPS_CLIENT_SECRET!,
      "Ocp-Apim-Subscription-Key": SUB_KEY(),
    },
  });
  if (!res.ok) throw new Error(`Vipps token: ${res.status} ${await res.text()}`);
  const data = await res.json();
  _token = data.access_token as string;
  _tokenExpiry = Date.now() + (Number(data.expires_in) - 60) * 1000;
  return _token;
}

function headers(token: string, idempotencyKey?: string): HeadersInit {
  return {
    "Authorization": `Bearer ${token}`,
    "Ocp-Apim-Subscription-Key": SUB_KEY(),
    "Merchant-Serial-Number": MSN(),
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

// ─── ePayment ─────────────────────────────────────────────

export interface CreatePaymentResult {
  reference: string;
  redirectUrl: string;
}

export async function createPayment(opts: {
  reference: string;       // unique order ID (uuid)
  totalNok: number;        // full amount buyer pays (price + fee)
  description: string;
  returnUrl: string;
  callbackUrl: string;
  callbackAuthorizationToken?: string; // sent as Authorization header in Vipps callbacks
}): Promise<CreatePaymentResult> {
  const token = await getAccessToken();
  const body: Record<string, unknown> = {
    amount: { currency: "NOK", value: Math.round(opts.totalNok * 100) },
    paymentMethod: { type: "WALLET" },
    reference: opts.reference,
    returnUrl: opts.returnUrl,
    userFlow: "WEB_REDIRECT",
    callbackUrl: opts.callbackUrl,
    paymentDescription: opts.description,
  };
  if (opts.callbackAuthorizationToken) {
    body.callbackAuthorizationToken = opts.callbackAuthorizationToken;
  }
  const res = await fetch(`${BASE_URL}/epayment/v1/payments`, {
    method: "POST",
    headers: headers(token, opts.reference),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vipps createPayment: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { reference: data.reference, redirectUrl: data.redirectUrl };
}

export async function getPaymentStatus(reference: string): Promise<{ state: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/epayment/v1/payments/${reference}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`Vipps getPayment: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function refundPayment(reference: string, amountNok: number): Promise<void> {
  const token = await getAccessToken();
  const idempotencyKey = `refund-${reference}-${Date.now()}`;
  const res = await fetch(`${BASE_URL}/epayment/v1/payments/${reference}/refund`, {
    method: "POST",
    headers: headers(token, idempotencyKey),
    body: JSON.stringify({
      modificationAmount: { currency: "NOK", value: Math.round(amountNok * 100) },
    }),
  });
  if (!res.ok) throw new Error(`Vipps refund: ${res.status} ${await res.text()}`);
}

// ─── Payout ───────────────────────────────────────────────

export async function initiatePayout(opts: {
  payoutId: string;
  recipientPhone: string; // Norwegian number with country prefix, e.g. "4790000000"
  amountNok: number;
  description: string;
  externalId: string;
}): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/payout/v1/msn/${MSN()}/initiate-payout`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      payoutId: opts.payoutId,
      recipients: [{
        phoneNumber: opts.recipientPhone,
        amount: { value: Math.round(opts.amountNok * 100), currency: "NOK" },
        externalId: opts.externalId,
        description: opts.description,
      }],
    }),
  });
  if (!res.ok) throw new Error(`Vipps payout: ${res.status} ${await res.text()}`);
}

// ─── Recurring ────────────────────────────────────────────

export interface AgreementResult {
  agreementId: string;
  vippsConfirmationUrl: string;
}

export async function createAgreement(opts: {
  amountOre: number;        // monthly amount in øre
  productName: string;
  productDescription: string;
  merchantRedirectUrl: string;
  metadata: Record<string, string>;
}): Promise<AgreementResult> {
  const token = await getAccessToken();
  const idempotencyKey = `agreement-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const res = await fetch(`${BASE_URL}/recurring/v3/agreements`, {
    method: "POST",
    headers: headers(token, idempotencyKey),
    body: JSON.stringify({
      pricing: { type: "LEGACY", amount: opts.amountOre, currency: "NOK" },
      interval: { unit: "MONTH", count: 1 },
      merchantRedirectUrl: opts.merchantRedirectUrl,
      merchantAgreementUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/vilkar`,
      productName: opts.productName,
      productDescription: opts.productDescription,
    }),
  });
  if (!res.ok) throw new Error(`Vipps createAgreement: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getAgreement(agreementId: string): Promise<{ status: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/recurring/v3/agreements/${agreementId}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`Vipps getAgreement: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function stopAgreement(agreementId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/recurring/v3/agreements/${agreementId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ status: "STOPPED" }),
  });
  if (!res.ok) throw new Error(`Vipps stopAgreement: ${res.status} ${await res.text()}`);
}

/** Create a manual charge against an active agreement (call monthly via cron). */
export async function createCharge(opts: {
  agreementId: string;
  amountOre: number;
  description: string;
  dueDate: string; // YYYY-MM-DD
}): Promise<{ chargeId: string }> {
  const token = await getAccessToken();
  const idempotencyKey = `charge-${opts.agreementId}-${opts.dueDate}`;
  const res = await fetch(`${BASE_URL}/recurring/v3/agreements/${opts.agreementId}/charges`, {
    method: "POST",
    headers: headers(token, idempotencyKey),
    body: JSON.stringify({
      amount: opts.amountOre,
      currency: "NOK",
      description: opts.description,
      due: opts.dueDate,
      retryDays: 5,
    }),
  });
  if (!res.ok) throw new Error(`Vipps createCharge: ${res.status} ${await res.text()}`);
  return res.json();
}
