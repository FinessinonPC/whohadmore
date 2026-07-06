-- Extra daily game modes (Rank Five, Pinpoint). One result per player per
-- mode per day; the daily leaderboard sums these with the chain game score.
--
-- Run this in the Supabase SQL editor. Until it exists, mode submissions
-- quietly no-op and the leaderboard shows chain-only scores.

create table if not exists public.game_mode_results (
  id uuid primary key default gen_random_uuid(),
  play_date date not null,
  session_id text not null,
  mode text not null check (mode in ('rank', 'pinpoint', 'recall', 'split')),
  score integer not null default 0 check (score >= 0 and score <= 2000),
  created_at timestamptz not null default now(),
  unique (play_date, session_id, mode)
);

create index if not exists game_mode_results_date_idx
  on public.game_mode_results (play_date);

alter table public.game_mode_results enable row level security;
-- Server routes use the service role; no anon policies needed.
