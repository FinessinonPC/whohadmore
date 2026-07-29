-- One Chain result per session per day - enforced, not just intended.
--
-- game_mode_results has had `unique (play_date, session_id, mode)` since 0004,
-- but game_results never got the equivalent. Nothing enforces it: the complete
-- route checks for an existing row and then inserts, which two requests can
-- both pass. A duplicate would be quietly expensive, because the profile rollup
-- sums chainDailyScore over every chain row - so one duplicated day inflates
-- that player's all-time total, their level, and their leaderboard rank.
--
-- The index also serves the lookup the hub now does on every render
-- (session_id + play_date), which today falls back to the session-only index.
--
-- Run this in the Supabase SQL editor. The delete is a no-op if there are no
-- duplicates - which there probably aren't; this is a guard, not a repair.

-- Keep the best row per (session, day): highest score, then earliest, then
-- lowest id. Deterministic, and never takes points away from a player.
delete from public.game_results a
using public.game_results b
where a.session_id = b.session_id
  and a.play_date = b.play_date
  and a.id <> b.id
  and (
    coalesce(a.score, -1) < coalesce(b.score, -1)
    or (coalesce(a.score, -1) = coalesce(b.score, -1) and a.created_at > b.created_at)
    or (coalesce(a.score, -1) = coalesce(b.score, -1) and a.created_at = b.created_at and a.id > b.id)
  );

create unique index if not exists game_results_session_date_key
  on public.game_results (session_id, play_date);
