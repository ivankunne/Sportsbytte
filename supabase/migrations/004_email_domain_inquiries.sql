-- ============================================================
-- Sportsbyttet — Migration 004: Email domain gating + inquiries
-- Run in Supabase SQL Editor
-- ============================================================

-- Email domain gating on clubs
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS member_email_domain TEXT;

-- Buyer inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id          BIGSERIAL PRIMARY KEY,
  listing_id  INT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_name  TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inquiries' AND policyname = 'Allow inquiry inserts'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow inquiry inserts" ON inquiries FOR INSERT TO public WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inquiries' AND policyname = 'Allow inquiry reads'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow inquiry reads" ON inquiries FOR SELECT TO public USING (true)';
  END IF;
END $$;
