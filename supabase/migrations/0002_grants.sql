-- ============================================================================
-- WhoHadMore — explicit privilege grants for the PostgREST API roles.
--
-- Run this if you hit "permission denied for table ..." (Postgres code 42501).
-- RLS (migration 0001) is still the real gate on WHICH rows each role sees;
-- these grants just give the roles the base table privileges PostgREST needs.
--
--   service_role : full access (server-side admin writes; bypasses RLS)
--   anon/auth    : read-only, plus inserting anonymous game results
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- service_role — server-only admin writes. Has BYPASSRLS, but still needs grants.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- anon + authenticated — row visibility remains enforced by the RLS policies.
grant select on
  public.daily_games,
  public.game_cards,
  public.game_results,
  public.leaderboard_entries
  to anon, authenticated;

-- Anonymous result recording (RLS check allows it).
grant insert on public.game_results to anon, authenticated;

-- Authenticated user profiles (scaffold; gated by RLS to "own row").
grant select, insert, update on public.users to authenticated;

-- Keep future tables/sequences working for service_role without manual grants.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
