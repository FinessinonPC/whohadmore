-- ============================================================================
-- WhoHadMore — leaderboard / profiles (username-only, no password)
--
-- A profile is keyed to an anonymous session_id and carries a claimed username
-- plus rolled-up stats for the leaderboard. Reads are public; all writes go
-- through the service role.
-- ============================================================================

-- Per-game scoring is stored on results so profiles can be backfilled on claim.
alter table public.game_results add column if not exists points integer;
alter table public.game_results add column if not exists stars integer;

create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid unique not null,
  username         text unique,
  xp               integer not null default 0,
  total_stars      integer not null default 0,
  days_played      integer not null default 0,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_played_date date,
  monthly_score    integer not null default 0,
  monthly_period   text,                 -- "YYYY-MM"
  achievements     text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Case-insensitive uniqueness for usernames.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));
create index if not exists profiles_monthly_idx
  on public.profiles (monthly_period, monthly_score desc);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

-- Grants (RLS still gates rows). Writes happen via the service role.
grant select on public.profiles to anon, authenticated;
grant all privileges on public.profiles to service_role;
