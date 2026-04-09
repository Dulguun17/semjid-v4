-- ================================================================
--  Fix Settings Table RLS Policy
--  Allows public (unauthenticated) users to read referral letter
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ================================================================

-- Drop old auth-only read policy
drop policy if exists "Auth read settings" on settings;

-- Create new public read policy
create policy "Public read settings"
  on settings for select using (true);

-- This allows:
-- - Public users (on /booking page) to see referral letter URL
-- - Authenticated admins to still update/insert
