-- ============================================================
-- Migration 006: Permissive anon RLS policies (no-auth MVP)
-- Run this in your Supabase project SQL editor
--
-- ⚠️  These policies allow any anonymous visitor to write.
--     When user auth is added, replace each policy with the
--     commented-out AUTH VERSION directly below it.
-- ============================================================

-- ── listings ─────────────────────────────────────────────────
-- Anyone can read listings
CREATE POLICY "anon_select_listings" ON listings
  FOR SELECT TO public USING (true);

-- Anyone can insert listings
-- AUTH VERSION: USING (auth.uid() = seller_user_id)
CREATE POLICY "anon_insert_listings" ON listings
  FOR INSERT TO public WITH CHECK (true);

-- Anyone can update any listing (e.g. mark as sold)
-- AUTH VERSION: USING (auth.uid() = seller_user_id)
CREATE POLICY "anon_update_listings" ON listings
  FOR UPDATE TO public USING (true);

-- Anyone can delete any listing
-- AUTH VERSION: USING (auth.uid() = seller_user_id)
CREATE POLICY "anon_delete_listings" ON listings
  FOR DELETE TO public USING (true);


-- ── inquiries ────────────────────────────────────────────────
-- Anyone can send an inquiry
-- AUTH VERSION: WITH CHECK (auth.uid() = buyer_user_id)
CREATE POLICY "anon_insert_inquiries" ON inquiries
  FOR INSERT TO public WITH CHECK (true);

-- Anyone can read inquiries (seller inbox)
-- AUTH VERSION: USING (auth.uid() = seller_user_id OR auth.uid() = buyer_user_id)
CREATE POLICY "anon_select_inquiries" ON inquiries
  FOR SELECT TO public USING (true);


-- ── clubs ────────────────────────────────────────────────────
-- Anyone can read clubs
CREATE POLICY "anon_select_clubs" ON clubs
  FOR SELECT TO public USING (true);

-- Anyone can update any club (branding, invite token)
-- AUTH VERSION: USING (auth.uid() IN (SELECT user_id FROM club_admins WHERE club_id = id))
CREATE POLICY "anon_update_clubs" ON clubs
  FOR UPDATE TO public USING (true);


-- ── profiles ─────────────────────────────────────────────────
-- Anyone can read profiles
CREATE POLICY "anon_select_profiles" ON profiles
  FOR SELECT TO public USING (true);

-- Anyone can create a profile
-- AUTH VERSION: WITH CHECK (auth.uid() = user_id)
CREATE POLICY "anon_insert_profiles" ON profiles
  FOR INSERT TO public WITH CHECK (true);

-- Anyone can update any profile
-- AUTH VERSION: USING (auth.uid() = user_id)
CREATE POLICY "anon_update_profiles" ON profiles
  FOR UPDATE TO public USING (true);


-- ── memberships ──────────────────────────────────────────────
-- Anyone can read memberships
CREATE POLICY "anon_select_memberships" ON memberships
  FOR SELECT TO public USING (true);

-- Anyone can request/join membership
-- AUTH VERSION: WITH CHECK (auth.uid() = user_id)
CREATE POLICY "anon_insert_memberships" ON memberships
  FOR INSERT TO public WITH CHECK (true);

-- Anyone can update membership status (approve/reject)
-- AUTH VERSION: USING (auth.uid() IN (SELECT user_id FROM club_admins WHERE club_id = memberships.club_id))
CREATE POLICY "anon_update_memberships" ON memberships
  FOR UPDATE TO public USING (true);


-- ── announcements ────────────────────────────────────────────
-- Anyone can read announcements
CREATE POLICY "anon_select_announcements" ON announcements
  FOR SELECT TO public USING (true);

-- Anyone can post announcements
-- AUTH VERSION: WITH CHECK (auth.uid() IN (SELECT user_id FROM club_admins WHERE club_id = announcements.club_id))
CREATE POLICY "anon_insert_announcements" ON announcements
  FOR INSERT TO public WITH CHECK (true);

-- Anyone can delete announcements
-- AUTH VERSION: USING (auth.uid() IN (SELECT user_id FROM club_admins WHERE club_id = announcements.club_id))
CREATE POLICY "anon_delete_announcements" ON announcements
  FOR DELETE TO public USING (true);


-- ── saved_searches ───────────────────────────────────────────
-- Anyone can save a search alert
-- AUTH VERSION: WITH CHECK (auth.uid() = user_id)
CREATE POLICY "anon_insert_saved_searches" ON saved_searches
  FOR INSERT TO public WITH CHECK (true);


-- ── club_registrations ───────────────────────────────────────
-- Update status (approve/reject) — admin page
-- AUTH VERSION: USING (auth.uid() IN (SELECT user_id FROM admins))
CREATE POLICY "anon_update_club_registrations" ON club_registrations
  FOR UPDATE TO public USING (true);
