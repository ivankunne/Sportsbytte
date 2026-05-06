-- ── Teams ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS teams_club_id_idx ON teams(club_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teams_public_read" ON teams;
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "teams_anon_all" ON teams;
CREATE POLICY "teams_anon_all" ON teams FOR ALL USING (true) WITH CHECK (true);

-- ── Loan items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_items (
  id BIGSERIAL PRIMARY KEY,
  club_id BIGINT REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition TEXT DEFAULT 'God',
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS loan_items_club_id_idx ON loan_items(club_id);

ALTER TABLE loan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loan_items_public_read" ON loan_items;
CREATE POLICY "loan_items_public_read" ON loan_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "loan_items_anon_all" ON loan_items;
CREATE POLICY "loan_items_anon_all" ON loan_items FOR ALL USING (true) WITH CHECK (true);

-- ── Loan requests ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_requests (
  id BIGSERIAL PRIMARY KEY,
  loan_item_id BIGINT REFERENCES loan_items(id) ON DELETE CASCADE NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','returned','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS loan_requests_item_idx ON loan_requests(loan_item_id);

ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loan_requests_public_read" ON loan_requests;
CREATE POLICY "loan_requests_public_read" ON loan_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "loan_requests_anon_insert" ON loan_requests;
CREATE POLICY "loan_requests_anon_insert" ON loan_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "loan_requests_anon_update" ON loan_requests;
CREATE POLICY "loan_requests_anon_update" ON loan_requests FOR UPDATE USING (true);
