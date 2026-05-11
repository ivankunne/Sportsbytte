-- Vipps escrow: escrow state on transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status         text        NOT NULL DEFAULT 'released',
  ADD COLUMN IF NOT EXISTS release_at     timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS vipps_reference text,
  ADD COLUMN IF NOT EXISTS provider       text        NOT NULL DEFAULT 'stripe';

-- Seller payout phone for Vipps
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vipps_phone text;

-- Subscription agreement IDs for Vipps Recurring
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS vipps_agreement_id text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vipps_agreement_id text;
