-- Two columns the app has depended on for a long time but that no migration in
-- this repo ever created: they were added straight to the live database, so
-- production works while a database rebuilt from these files would not.
--
--   total_score  the one true points total. It is what the all-time leaderboard
--                ranks AND what levels a player up (see lib/leaderboard.ts).
--   email        set when an account is created through the email OTP flow.
--
-- `if not exists` throughout, so running this against the live database is a
-- no-op. Run it anyway - it is what makes the next fresh environment work.
--
-- Run this in the Supabase SQL editor.

alter table public.profiles
  add column if not exists total_score integer not null default 0,
  add column if not exists email text;

-- The all-time board orders by total_score desc over a filtered set, and the
-- profile's rank is a count of rows above yours - both want this index.
create index if not exists profiles_total_score_idx
  on public.profiles (total_score desc);

-- Sign-in looks an account up by email; one account per address.
create unique index if not exists profiles_email_key
  on public.profiles (lower(email)) where email is not null;

comment on column public.profiles.total_score is
  'All-time points: the leaderboard rank and the level track. Streaks never touch it.';
