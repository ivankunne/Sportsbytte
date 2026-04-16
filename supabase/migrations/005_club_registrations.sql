-- ============================================================
-- Sportsbyttet — Migration 005: Club registrations inbox
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS club_registrations (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected

  -- Club info
  club_name       TEXT NOT NULL,
  sport           TEXT,
  location        TEXT,
  member_count    TEXT,
  org_number      TEXT,

  -- Contact person
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  role            TEXT,

  -- Customisation
  logo_url        TEXT,
  primary_color   TEXT,
  secondary_color TEXT,
  description     TEXT
);

ALTER TABLE club_registrations ENABLE ROW LEVEL SECURITY;

-- Public INSERT so the registration form can write rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_registrations' AND policyname = 'Allow registration inserts'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow registration inserts" ON club_registrations FOR INSERT TO public WITH CHECK (true)';
  END IF;
END $$;

-- SELECT for reading in the admin inbox (page is password-gated at app level)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_registrations' AND policyname = 'Allow registration reads'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow registration reads" ON club_registrations FOR SELECT TO public USING (true)';
  END IF;
END $$;

-- Allow status updates from the admin inbox
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_registrations' AND policyname = 'Allow registration updates'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow registration updates" ON club_registrations FOR UPDATE TO public USING (true)';
  END IF;
END $$;
