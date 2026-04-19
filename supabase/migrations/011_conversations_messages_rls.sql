-- ============================================================
-- Migration 011: RLS policies for conversations and messages
-- Run this in your Supabase project SQL editor
-- ============================================================

-- ── conversations ────────────────────────────────────────────
CREATE POLICY "anon_select_conversations" ON conversations
  FOR SELECT TO public USING (true);

CREATE POLICY "anon_insert_conversations" ON conversations
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "anon_update_conversations" ON conversations
  FOR UPDATE TO public USING (true);


-- ── messages ─────────────────────────────────────────────────
CREATE POLICY "anon_select_messages" ON messages
  FOR SELECT TO public USING (true);

CREATE POLICY "anon_insert_messages" ON messages
  FOR INSERT TO public WITH CHECK (true);
