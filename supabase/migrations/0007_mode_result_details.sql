-- Per-game detail on quick-game results, powering the profile's game-specific
-- stats (avg time on the Mini, avg guesses on Word, mistakes on Duality) and
-- the achievements that need them (Speed Solver, Mind Meld).
--
-- Run this in the Supabase SQL editor. Until it exists, games still record
-- their scores - the API quietly falls back to score-only rows - but the
-- detail stats only accumulate from the moment the columns are live.

alter table public.game_mode_results
  add column if not exists seconds real
    check (seconds is null or (seconds >= 0 and seconds <= 86400)),
  add column if not exists moves integer
    check (moves is null or (moves >= 0 and moves <= 100)),
  add column if not exists won boolean;

comment on column public.game_mode_results.seconds is
  'Solve time in seconds (duality/mini; null for word).';
comment on column public.game_mode_results.moves is
  'Word: guesses used · Duality: mistakes · Mini: checks used.';
comment on column public.game_mode_results.won is
  'Word: solved · Duality: all four pairs found · Mini: solved without Reveal.';
