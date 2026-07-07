-- Per-date custom content for the pack games (Duality, Word, Mini), authored
-- in the admin (usually via the AI prompt flow). When a row exists for a date
-- and mode it overrides the bundled pack; otherwise the pack rotation serves
-- as the always-works fallback, so days without custom content still play.
--
-- Run this in the Supabase SQL editor (after 0002).

create table if not exists public.daily_minigames (
  id uuid primary key default gen_random_uuid(),
  play_date date not null,
  mode text not null check (mode in ('duality', 'word', 'mini')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (play_date, mode)
);

create index if not exists daily_minigames_date_idx
  on public.daily_minigames (play_date);

alter table public.daily_minigames enable row level security;
-- Server routes use the service role; no anon policies needed.
