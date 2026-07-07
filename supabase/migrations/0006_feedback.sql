-- Lightweight product feedback (e.g. the multi-game format thumbs up/down).
-- One vote per session per topic. Run in the Supabase SQL editor (optional -
-- the app no-ops gracefully if this table doesn't exist).

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  topic text not null,
  value text not null,
  created_at timestamptz not null default now(),
  unique (session_id, topic)
);

create index if not exists feedback_topic_idx on public.feedback (topic, value);

alter table public.feedback enable row level security;
-- Server routes use the service role; no anon policies needed.
