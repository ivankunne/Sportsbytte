-- ============================================================
-- Migration 009: Seed complete categories table
-- Run in Supabase SQL Editor
--
-- Inserts all categories used across the platform.
-- ON CONFLICT DO UPDATE ensures emoji/name stay current
-- even if some rows already exist.
-- ============================================================

INSERT INTO categories (name, slug, emoji)
VALUES
  ('Alpint',       'alpint',       '⛷️'),
  ('Langrenn',     'langrenn',     '🎿'),
  ('Fotball',      'fotball',      '⚽'),
  ('Ishockey',     'ishockey',     '🏒'),
  ('Håndball',     'handball',     '🤾'),
  ('Sykling',      'sykling',      '🚴'),
  ('Løping',       'loping',       '👟'),
  ('Friluftsliv',  'friluftsliv',  '🏕️'),
  ('Svømming',     'svomming',     '🏊'),
  ('Tennis',       'tennis',       '🎾'),
  ('Basketball',   'basketball',   '🏀'),
  ('Kampsport',    'kampsport',    '🥋')
ON CONFLICT (slug) DO UPDATE
  SET name  = EXCLUDED.name,
      emoji = EXCLUDED.emoji;
