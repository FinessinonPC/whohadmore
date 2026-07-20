-- First-party event counter (share clicks and the pop-up funnel), so key
-- product numbers live in OUR database and don't depend on the Vercel plan.
-- Written by /api/track (service role); read with simple SQL in the editor.
--
-- Run this in the Supabase SQL editor.

create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  event      text not null,           -- 'share_click' | 'results_modal_shown' | 'past_card_click'
  surface    text,                    -- where it happened: results_modal / card_complete / hub
  game       text,                    -- per-game context when relevant
  session_id text not null,           -- who (anonymous session), for dedupe/uniques
  play_date  date,                    -- the card the action was about
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_time_idx
  on public.analytics_events (event, created_at desc);

alter table public.analytics_events enable row level security;
-- Server routes use the service role; no anon policies needed.
