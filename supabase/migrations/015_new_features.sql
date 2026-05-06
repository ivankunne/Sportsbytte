-- ============================================================
-- Migration 015: Location, expiry, reports, blocking, drafts,
--                transactions, subcategories, buyer reviews
-- ============================================================

-- ── 1. Listings: location + coordinates + expiry ─────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS location    TEXT,
  ADD COLUMN IF NOT EXISTS lat         NUMERIC,
  ADD COLUMN IF NOT EXISTS lng         NUMERIC,
  ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '42 days');

-- Back-fill expiry for existing listings (42 days from created_at)
UPDATE listings SET expires_at = created_at + INTERVAL '42 days' WHERE expires_at IS NULL;

-- ── 2. Reviews: buyer review support ─────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS review_type TEXT NOT NULL DEFAULT 'seller';
-- review_type values: 'seller' | 'buyer'

-- ── 3. Categories: subcategory support + sport attributes ─────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id        BIGINT REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS sport_attributes JSONB;

-- ── 4. Reports table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id             BIGSERIAL PRIMARY KEY,
  listing_id     BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id    BIGINT REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reason         TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- reason values: 'scam' | 'wrong_category' | 'inappropriate' | 'already_sold' | 'other'
-- status values: 'pending' | 'reviewed' | 'dismissed'

CREATE INDEX IF NOT EXISTS reports_listing_id_idx ON reports(listing_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert a report" ON reports;
CREATE POLICY "Anyone can insert a report"
  ON reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read all reports" ON reports;
CREATE POLICY "Admins can read all reports"
  ON reports FOR SELECT USING (true);

-- ── 5. Blocked users table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
  id         BIGSERIAL PRIMARY KEY,
  blocker_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx ON blocked_users(blocker_id);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own blocks" ON blocked_users;
CREATE POLICY "Users can manage their own blocks"
  ON blocked_users FOR ALL USING (true) WITH CHECK (true);

-- ── 6. Listing drafts (DB-persisted, one per user) ───────────
CREATE TABLE IF NOT EXISTS listing_drafts (
  id         BIGSERIAL PRIMARY KEY,
  seller_id  BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  form_data  JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own drafts" ON listing_drafts;
CREATE POLICY "Users can manage their own drafts"
  ON listing_drafts FOR ALL USING (true) WITH CHECK (true);

-- ── 7. Transactions table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                       BIGSERIAL PRIMARY KEY,
  listing_id               BIGINT REFERENCES listings(id),
  buyer_profile_id         BIGINT REFERENCES profiles(id),
  seller_profile_id        BIGINT REFERENCES profiles(id),
  amount                   INT NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_buyer_profile_id_idx  ON transactions(buyer_profile_id);
CREATE INDEX IF NOT EXISTS transactions_seller_profile_id_idx ON transactions(seller_profile_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view their transactions" ON transactions;
CREATE POLICY "Participants can view their transactions"
  ON transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT WITH CHECK (true);

-- ── 8. Seed expanded sport categories ───────────────────────
INSERT INTO categories (name, slug, emoji) VALUES
  ('Håndball',        'handball',       '🤾'),
  ('Basketball',      'basketball',     '🏀'),
  ('Tennis / Padel',  'tennis-padel',   '🎾'),
  ('Svømming',        'svomming',       '🏊'),
  ('Golf',            'golf',           '⛳'),
  ('Kampsport',       'kampsport',      '🥊'),
  ('Roing / Padling', 'roing-padling',  '🚣'),
  ('Volleyball',      'volleyball',     '🏐'),
  ('Klatring',        'klatring',       '🧗'),
  ('Bandy',           'bandy',          '🏒'),
  ('Friidrett',       'friidrett',      '🏅'),
  ('Ski (andre)',     'ski-andre',      '🎿')
ON CONFLICT (slug) DO NOTHING;
