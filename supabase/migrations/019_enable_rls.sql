-- ============================================================
-- Migration 019: Enable RLS on tables where policies exist
--                but RLS was never activated
-- ============================================================
-- These three tables had policies created in earlier migrations
-- but were missing the ENABLE ROW LEVEL SECURITY statement.
-- Enabling RLS here does not change effective access — the
-- existing permissive policies (USING true) remain in place.

ALTER TABLE public.announcements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
