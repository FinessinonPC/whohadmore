-- Store each Chain result's round count on the row itself, so recomputing a
-- profile scores every game exactly as it was played (correct/rounds x 1000)
-- without re-deriving the day's card count. Older rows resolve their rounds
-- from the day's cards at recompute time; brand-new rows carry it directly.
--
-- Run this in the Supabase SQL editor.

alter table public.game_results
  add column if not exists rounds integer
    check (rounds is null or (rounds >= 1 and rounds <= 50));

comment on column public.game_results.rounds is
  'Rounds in that day''s chain (cards - 1). Null on legacy rows - resolved from game_cards.';
