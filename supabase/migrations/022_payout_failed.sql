-- Track Vipps payout failures so admin can process manually
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payout_failed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_error  text;

CREATE INDEX IF NOT EXISTS transactions_payout_failed_idx
  ON transactions (payout_failed)
  WHERE payout_failed = true;
