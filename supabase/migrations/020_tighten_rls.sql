-- ============================================================
-- Migration 020: Tighten RLS policies for critical tables
-- ============================================================
-- Fixes the most impactful permissive-true policies while leaving
-- intentional public-submission tables alone.
-- ============================================================

-- ── profiles: lock UPDATE to own profile ─────────────────────
-- Was: anyone can overwrite any user's name, bio, avatar_url, etc.
DROP POLICY IF EXISTS "anon_update_profiles"  ON profiles;
DROP POLICY IF EXISTS "Allow profile updates"  ON profiles;

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING     (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());


-- ── blocked_users: lock to own blocks ────────────────────────
-- Was: anyone could block/unblock on behalf of any user.
DROP POLICY IF EXISTS "Users can manage their own blocks" ON blocked_users;

CREATE POLICY "users_manage_own_blocks" ON blocked_users
  FOR ALL TO authenticated
  USING     (blocker_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (blocker_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));


-- ── listing_drafts: lock to own drafts ───────────────────────
-- Was: anyone could read or delete any seller's saved draft.
DROP POLICY IF EXISTS "Users can manage their own drafts" ON listing_drafts;

CREATE POLICY "sellers_manage_own_drafts" ON listing_drafts
  FOR ALL TO authenticated
  USING     (seller_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (seller_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));


-- ── listings INSERT: require authentication ───────────────────
-- Was: any anonymous visitor could insert a listing.
-- The /selg UI already requires login, but the API had no RLS check.
DROP POLICY IF EXISTS "anon_insert_listings" ON listings;

CREATE POLICY "auth_insert_listings" ON listings
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );


-- ── storage: remove full-bucket listing permission ────────────
-- Public buckets serve files by URL without needing a SELECT policy
-- on storage.objects. The broad USING(bucket_id = '...') policy
-- additionally allows clients to enumerate all file paths via the
-- storage API, which leaks upload paths unnecessarily.
--
-- chat-images: restrict reads to authenticated users only.
-- listing-images: drop the storage.objects policy entirely; the
--   bucket is public so images load fine by URL without it.

DROP POLICY IF EXISTS "chat_images_public_read"                  ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view listing images 1i0okip_0" ON storage.objects;

-- Chat images: authenticated users can read (they need to be
-- logged in to participate in a chat anyway).
CREATE POLICY "chat_images_auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-images');

-- Listing images: no storage.objects SELECT policy needed.
-- The bucket is marked public so Supabase CDN serves files by URL.
-- Listing the bucket contents via the API is now blocked.
