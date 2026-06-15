-- ============================================================================
-- WhoHadMore — initial schema
-- Tables: daily_games, game_cards, game_results, users, leaderboard_entries
-- Row Level Security is enabled on every table.
--   * daily_games / game_cards : publicly readable ONLY when published = true
--   * game_results             : anon-insertable, publicly readable (session scoped)
--   * users / leaderboard_*    : scaffold for future auth + leaderboards
-- Admin writes go through the service-role key, which bypasses RLS entirely.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- daily_games
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

-- ---------------------------------------------------------------------------
-- game_cards
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- game_results (anonymous session tracking for now)
-- ---------------------------------------------------------------------------
create table if not exists public.game_results (
  id              uuid primary key default gen_random_uuid(),
  play_date       date not null,
  session_id      uuid not null,
  score           integer,
  lives_remaining integer,
  completed       boolean,
  time_seconds    integer,
  created_at      timestamptz not null default now()
);

create index if not exists game_results_play_date_idx on public.game_results (play_date);
create index if not exists game_results_session_idx on public.game_results (session_id);

-- ---------------------------------------------------------------------------
-- users (scaffold only — not active yet)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- leaderboard_entries (scaffold only)
-- ---------------------------------------------------------------------------
create table if not exists public.leaderboard_entries (
  id              uuid primary key default gen_random_uuid(),
  play_date       date not null,
  user_id         uuid references public.users (id) on delete cascade,
  score           integer,
  lives_remaining integer,
  time_seconds    integer,
  rank            integer,
  created_at      timestamptz not null default now()
);

create index if not exists leaderboard_entries_play_date_idx
  on public.leaderboard_entries (play_date);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.daily_games         enable row level security;
alter table public.game_cards          enable row level security;
alter table public.game_results        enable row level security;
alter table public.users               enable row level security;
alter table public.leaderboard_entries enable row level security;

-- --- daily_games: published games are world-readable -----------------------
drop policy if exists "Published games are publicly readable" on public.daily_games;
create policy "Published games are publicly readable"
  on public.daily_games
  for select
  using (published = true);

-- --- game_cards: readable when their parent game is published ---------------
drop policy if exists "Cards of published games are publicly readable" on public.game_cards;
create policy "Cards of published games are publicly readable"
  on public.game_cards
  for select
  using (
    exists (
      select 1
      from public.daily_games g
      where g.id = game_cards.game_id
        and g.published = true
    )
  );

-- --- game_results: anyone may record a result; results are publicly readable
drop policy if exists "Anyone can insert a game result" on public.game_results;
create policy "Anyone can insert a game result"
  on public.game_results
  for insert
  with check (true);

drop policy if exists "Game results are publicly readable" on public.game_results;
create policy "Game results are publicly readable"
  on public.game_results
  for select
  using (true);

-- --- users: a user can read / manage only their own row (scaffold) ----------
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users
  for select
  using (auth.uid() = id);

drop policy if exists "Users can upsert own profile" on public.users;
create policy "Users can upsert own profile"
  on public.users
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- leaderboard_entries: publicly readable (writes via service role) -------
drop policy if exists "Leaderboard entries are publicly readable" on public.leaderboard_entries;
create policy "Leaderboard entries are publicly readable"
  on public.leaderboard_entries
  for select
  using (true);
