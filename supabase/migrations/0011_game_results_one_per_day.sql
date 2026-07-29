-- One Chain result per session per day.
--
-- game_mode_results has had `unique (play_date, session_id, mode)` since 0004;
-- game_results never got the equivalent. Nothing enforces it: the complete
-- route checks for an existing row and then inserts, which two requests can
-- both pass. A duplicate is quietly expensive, because the profile rollup sums
-- chainDailyScore over every chain row - so one duplicated day inflates that
-- player's all-time total, their level and their leaderboard rank.
--
-- THIS MIGRATION DELETES NOTHING. An earlier version of it opened with a
-- DELETE, which is not something anyone should paste into a production SQL
-- editor on someone else's say-so. Instead it just tries to create the index:
-- if there are no duplicates it succeeds, and if there are, it fails safely
-- and the query below tells you exactly which rows to look at.
--
-- Run this in the Supabase SQL editor.

create unique index if not exists game_results_session_date_key
  on public.game_results (session_id, play_date);

-- If the statement above failed with a uniqueness error, run this to see the
-- offending rows, decide which to keep, and remove them by id yourself:
--
--   select session_id, play_date, count(*), array_agg(id) as ids,
--          array_agg(score) as scores
--   from public.game_results
--   group by session_id, play_date
--   having count(*) > 1
--   order by play_date desc;
