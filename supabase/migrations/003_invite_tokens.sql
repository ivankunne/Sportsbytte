-- ============================================================
-- Sportsbyttet — Migration 003: Club invite tokens + CSV import support
-- Run in Supabase SQL Editor
-- ============================================================

-- Add invite token to clubs (UUID, auto-generated per club)
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT gen_random_uuid();

-- Backfill any clubs that don't have a token yet
UPDATE clubs SET invite_token = gen_random_uuid() WHERE invite_token IS NULL;

-- Allow anyone to look up a club by invite token (needed for join page)
-- (No extra RLS needed if clubs table is already readable by public)

-- Allow inserts into memberships (for invite join flow)
-- If not already done from migration 001, add this policy:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'memberships' AND policyname = 'Allow membership inserts'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow membership inserts" ON memberships FOR INSERT TO public WITH CHECK (true)';
  END IF;
END $$;

-- Allow reads on memberships (for admin panel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'memberships' AND policyname = 'Allow membership reads'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow membership reads" ON memberships FOR SELECT TO public USING (true)';
  END IF;
END $$;

-- Allow updates on memberships (for approve/reject)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'memberships' AND policyname = 'Allow membership updates'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow membership updates" ON memberships FOR UPDATE TO public USING (true)';
  END IF;
END $$;

-- Allow profile inserts (for CSV import and invite join)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Allow profile inserts'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow profile inserts" ON profiles FOR INSERT TO public WITH CHECK (true)';
  END IF;
END $$;

-- Allow profile reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Allow profile reads'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow profile reads" ON profiles FOR SELECT TO public USING (true)';
  END IF;
END $$;
