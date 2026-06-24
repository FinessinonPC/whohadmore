-- ============================================================================
-- WhoHadMore — full idempotent setup.
--
-- Safe to run on a fresh project OR an existing one: it only creates what's
-- missing. Run this once in the Supabase SQL Editor if you hit
-- "relation ... does not exist". It rolls up migrations 0001–0003.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.daily_games (
  id             uuid primary key default gen_random_uuid(),
  play_date      date unique not null,
  topic_label    text not null,
  topic_category text,
  stat_label     text not null,
  stat_unit      text,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.game_cards (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.daily_games(id) on delete cascade,
  position     integer not null,
  entity_name  text not null,
  stat_value   numeric not null,
  image_url    text,
  image_source text,
  created_at   timestamptz not null default now(),
  unique (game_id, position)
);
create index if not exists game_cards_game_id_idx on public.game_cards (game_id);

create table if not exists public.game_results (
  id              uuid primary key default gen_random_uuid(),
  play_date       date not null,
  session_id      uuid not null,
  score           integer,
  lives_remaining integer,
  completed       boolean,
  time_seconds    integer,
  points          integer,
  stars           integer,
  created_at      timestamptz not null default now()
);
-- In case game_results already existed without the newer columns (an early
-- partial migration may have created it without these). Adding them is
-- idempotent and is required for the daily leaderboard to record plays.
alter table public.game_results add column if not exists lives_remaining integer;
alter table public.game_results add column if not exists completed boolean;
alter table public.game_results add column if not exists time_seconds integer;
alter table public.game_results add column if not exists points integer;
alter table public.game_results add column if not exists stars integer;
create index if not exists game_results_play_date_idx on public.game_results (play_date);
create index if not exists game_results_session_idx on public.game_results (session_id);

create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid unique not null,
  username         text unique,
  xp               integer not null default 0,
  total_score      integer not null default 0,
  total_stars      integer not null default 0,
  days_played      integer not null default 0,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_played_date date,
  monthly_score    integer not null default 0,
  monthly_period   text,
  achievements     text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- Streak-free all-time leaderboard score (sum of daily scores). Added
-- idempotently for tables created before this column existed.
alter table public.profiles add column if not exists total_score integer not null default 0;
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_monthly_idx on public.profiles (monthly_period, monthly_score desc);

-- ---------------------------------------------------------------------------
-- Row Level Security + policies
-- ---------------------------------------------------------------------------
alter table public.daily_games  enable row level security;
alter table public.game_cards   enable row level security;
alter table public.game_results enable row level security;
alter table public.profiles     enable row level security;

drop policy if exists "Published games are publicly readable" on public.daily_games;
create policy "Published games are publicly readable"
  on public.daily_games for select using (published = true);

drop policy if exists "Cards of published games are publicly readable" on public.game_cards;
create policy "Cards of published games are publicly readable"
  on public.game_cards for select
  using (exists (select 1 from public.daily_games g where g.id = game_cards.game_id and g.published = true));

drop policy if exists "Anyone can insert a game result" on public.game_results;
create policy "Anyone can insert a game result"
  on public.game_results for insert with check (true);
drop policy if exists "Game results are publicly readable" on public.game_results;
create policy "Game results are publicly readable"
  on public.game_results for select using (true);

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

-- ---------------------------------------------------------------------------
-- Grants (RLS still gates rows; service_role bypasses RLS for admin writes)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on public.daily_games, public.game_cards to anon, authenticated;
grant select, insert on public.game_results to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
