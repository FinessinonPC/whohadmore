// ============================================================================
// THE single source of truth for a player's rolled-up profile: XP, all-time
// points, days played, streaks, monthly score, and achievements - computed
// from the full game history (Chain + the quick games, live days AND archive).
//
// Every write path calls this after recording a game (and sign-in/claim call
// it when adopting history), so the profile can never drift from the rows.
// That is what retires the manual admin backfill: live play and recompute run
// the SAME math by construction.
//
// Scoring rules (the one true set):
//   XP           = Σ chain rows' stored points (streak-boosted at play time)
//                + Σ modeXp(quick-game score)          … 0–150 per game
//   total_score  = Σ chainDailyScore(correct, rounds)  … 0–1000 per chain day
//                + Σ quick-game scores                 … 0–1000 per game
//   a "day played" = any recorded game that date; streaks run over those days
//   monthly      = this month's XP-earning (chain points + quick-game XP)
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { previousISODate } from "@/lib/date";
import {
  chainDailyScore,
  earnedAchievementIds,
  levelFromXp,
  modeXp,
} from "@/lib/leaderboard";

export interface ChainHistoryRow {
  play_date: string;
  score: number | null; // correct calls
  points: number | null; // XP credited at play time (streak included)
  stars: number | null;
  rounds?: number | null; // stored from migration 0009 on; older rows resolve via cards
}

export interface ModeHistoryRow {
  play_date: string;
  mode: string;
  score: number | null;
  seconds: number | null;
  moves: number | null;
  won: boolean | null;
}

export interface Rollup {
  xp: number;
  totalScore: number;
  totalStars: number;
  daysPlayed: number;
  currentStreak: number; // consecutive played days ending today/yesterday
  longestRun: number; // longest consecutive run anywhere in history
  lastPlayed: string | null;
  monthlyScore: number;
  achievements: string[];
  gamesRecorded: number;
}

const DEFAULT_ROUNDS = 10;

/** Longest consecutive-day run in a set of ISO dates. */
function longestRunOf(sorted: string[]): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && previousISODate(d) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Consecutive played days ending at today (or yesterday, grace for tz). */
function currentRunOf(dates: Set<string>, today: string): number {
  let cursor = dates.has(today) ? today : dates.has(previousISODate(today)) ? previousISODate(today) : null;
  let streak = 0;
  while (cursor && dates.has(cursor)) {
    streak += 1;
    cursor = previousISODate(cursor);
  }
  return streak;
}

/**
 * Pure rollup over full history. `roundsByDate` supplies round counts for
 * chain rows that don't carry their own (pre-0009 rows).
 */
export function rollupFrom(
  chain: ChainHistoryRow[],
  modes: ModeHistoryRow[],
  roundsByDate: Map<string, number>,
  today: string,
  period: string
): Rollup {
  const roundsFor = (r: ChainHistoryRow): number => {
    const stored = typeof r.rounds === "number" && r.rounds > 0 ? r.rounds : null;
    return stored ?? roundsByDate.get(r.play_date) ?? DEFAULT_ROUNDS;
  };

  const chainDaily = chain.map((r) => chainDailyScore(r.score ?? 0, roundsFor(r)));
  const xp =
    chain.reduce((s, r) => s + (r.points ?? 0), 0) +
    modes.reduce((s, r) => s + modeXp(r.score ?? 0), 0);
  const totalScore =
    chainDaily.reduce((s, p) => s + p, 0) + modes.reduce((s, r) => s + (r.score ?? 0), 0);
  const totalStars = chain.reduce((s, r) => s + (r.stars ?? 0), 0);

  const dates = new Set<string>([
    ...chain.map((r) => r.play_date),
    ...modes.map((r) => r.play_date),
  ]);
  const sorted = Array.from(dates).sort();
  const daysPlayed = dates.size;
  const currentStreak = currentRunOf(dates, today);
  const longestRun = longestRunOf(sorted);
  const lastPlayed = sorted.length ? sorted[sorted.length - 1] : null;

  const monthlyScore =
    chain.filter((r) => r.play_date.startsWith(period)).reduce((s, r) => s + (r.points ?? 0), 0) +
    modes.filter((r) => r.play_date.startsWith(period)).reduce((s, r) => s + modeXp(r.score ?? 0), 0);

  // --- Achievements, derived from history wherever the data allows ----------
  const anyChainClear = chain.some((r) => (r.score ?? 0) >= roundsFor(r) && roundsFor(r) > 0);
  const earned = new Set(
    earnedAchievementIds({
      daysPlayed,
      // Streak badges reward *reaching* a streak - the historical best counts.
      currentStreak: longestRun,
      level: levelFromXp(xp),
      clearedThisGame: anyChainClear,
    })
  );
  for (const r of modes) {
    const score = r.score ?? 0;
    if (score >= 1000) earned.add("thousand_club");
    if (r.mode === "word" && score >= 800) earned.add("word_ace"); // a loss caps at 200, so ≥800 is a ≤3-guess win
    if (r.mode === "word" && score >= 900) earned.add("word_two");
    if (r.mode === "duality" && r.won === true && r.moves === 0) earned.add("duality_perfect");
    if (r.mode === "mini" && r.won === true && r.moves === 0) earned.add("mini_clean");
    if (r.mode === "mini" && r.won === true && r.seconds !== null && r.seconds < 60) earned.add("mini_speed");
  }
  // The Full Sweep: some date with the chain + all three quick games.
  const modesByDate = new Map<string, Set<string>>();
  for (const r of modes) {
    (modesByDate.get(r.play_date) ?? modesByDate.set(r.play_date, new Set()).get(r.play_date)!).add(r.mode);
  }
  const chainDates = new Set(chain.map((r) => r.play_date));
  for (const [date, set] of modesByDate) {
    if (set.size >= 3 && chainDates.has(date)) {
      earned.add("all_rounder");
      break;
    }
  }
  const gamesRecorded = chain.length + modes.length;
  if (gamesRecorded >= 100) earned.add("century");

  return {
    xp,
    totalScore,
    totalStars,
    daysPlayed,
    currentStreak,
    longestRun,
    lastPlayed,
    monthlyScore,
    achievements: Array.from(earned),
    gamesRecorded,
  };
}

/** Fetch a session's full history and compute its rollup. */
export async function computeRollup(
  supabase: SupabaseClient,
  session_id: string,
  today: string,
  period: string
): Promise<Rollup> {
  // select("*") on both tables so optional columns (rounds / seconds / moves /
  // won) simply come back missing instead of erroring before their migrations.
  const [{ data: chainRaw }, { data: modesRaw }] = await Promise.all([
    supabase.from("game_results").select("*").eq("session_id", session_id),
    supabase.from("game_mode_results").select("*").eq("session_id", session_id),
  ]);

  const chain: ChainHistoryRow[] = (chainRaw ?? []).map((r: Record<string, unknown>) => ({
    play_date: String(r.play_date ?? ""),
    score: typeof r.score === "number" ? r.score : null,
    points: typeof r.points === "number" ? r.points : null,
    stars: typeof r.stars === "number" ? r.stars : null,
    rounds: typeof r.rounds === "number" ? r.rounds : null,
  }));
  const modes: ModeHistoryRow[] = (modesRaw ?? []).map((r: Record<string, unknown>) => ({
    play_date: String(r.play_date ?? ""),
    mode: String(r.mode ?? ""),
    score: typeof r.score === "number" ? r.score : null,
    seconds: typeof r.seconds === "number" ? r.seconds : null,
    moves: typeof r.moves === "number" ? r.moves : null,
    won: typeof r.won === "boolean" ? r.won : null,
  }));

  // Resolve round counts for chain rows that predate the stored column: the
  // day's card count minus one, exactly how the archive derives it.
  const needDates = Array.from(
    new Set(chain.filter((r) => !(typeof r.rounds === "number" && r.rounds > 0)).map((r) => r.play_date))
  );
  const roundsByDate = new Map<string, number>();
  if (needDates.length) {
    const { data: games } = await supabase
      .from("daily_games")
      .select("id, play_date")
      .in("play_date", needDates);
    const gameIds = (games ?? []).map((g: { id: string }) => g.id);
    if (gameIds.length) {
      const { data: cards } = await supabase
        .from("game_cards")
        .select("game_id")
        .in("game_id", gameIds);
      const countByGame = new Map<string, number>();
      for (const c of (cards ?? []) as { game_id: string }[]) {
        countByGame.set(c.game_id, (countByGame.get(c.game_id) ?? 0) + 1);
      }
      for (const g of (games ?? []) as { id: string; play_date: string }[]) {
        const count = countByGame.get(g.id) ?? 0;
        if (count >= 2) roundsByDate.set(g.play_date, count - 1);
      }
    }
  }

  return rollupFrom(chain, modes, roundsByDate, today, period);
}

/**
 * Recompute a profile from history and write it. Merges achievements (stored ∪
 * derived ∪ any live-request extras) and never lowers longest_streak. Quietly
 * does nothing for sessions without a profile (anonymous players).
 */
export async function applyRollup(
  supabase: SupabaseClient,
  session_id: string,
  today: string,
  period: string,
  opts: { extraAchievements?: string[] } = {}
): Promise<{ profile: Record<string, unknown> | null; newAchievements: string[] }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle<{ id: string; achievements: string[] | null; longest_streak: number | null }>();
  if (!profile) return { profile: null, newAchievements: [] };

  const roll = await computeRollup(supabase, session_id, today, period);
  const have = profile.achievements ?? [];
  const merged = Array.from(
    new Set([...have, ...roll.achievements, ...(opts.extraAchievements ?? [])])
  );

  const { data: updated } = await supabase
    .from("profiles")
    .update({
      xp: roll.xp,
      total_score: roll.totalScore,
      total_stars: roll.totalStars,
      days_played: roll.daysPlayed,
      current_streak: roll.currentStreak,
      longest_streak: Math.max(profile.longest_streak ?? 0, roll.longestRun, roll.currentStreak),
      last_played_date: roll.lastPlayed,
      monthly_score: roll.monthlyScore,
      monthly_period: period,
      achievements: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("*")
    .single();

  return {
    profile: updated ?? null,
    newAchievements: merged.filter((a) => !have.includes(a)),
  };
}
