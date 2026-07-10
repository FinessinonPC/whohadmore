// ============================================================================
// Shared daily-leaderboard query. Used by the leaderboard page at SSR time (no
// viewer yet - the browser's session id isn't known server-side) and by the
// client API route (viewer known, so it can mark "you"). Independent queries
// run in parallel instead of one at a time, which is most of the fix: the
// original version awaited five Supabase round trips back to back.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { dailyScore, heartsFor, type DailyRow } from "@/lib/leaderboard";
import { hashSeed } from "@/lib/seed";

// A stable, unique-ish display name for a profile-less player, derived from
// their session id so it's the same every day (e.g. "Unknown4821").
function unknownName(sessionId: string): string {
  return `Unknown${1000 + (hashSeed(sessionId) % 9000)}`;
}

interface ModeRow {
  session_id: string;
  score: number | null;
}

/** Extra-mode points (Duality/Word/Mini). Best-effort: an unmigrated
 *  game_mode_results table just means a chain-only board, not a hard error. */
async function safeModeRows(supabase: SupabaseClient, date: string): Promise<ModeRow[]> {
  try {
    const { data } = await supabase
      .from("game_mode_results")
      .select("session_id, score")
      .eq("play_date", date)
      .returns<ModeRow[]>();
    return data ?? [];
  } catch {
    return [];
  }
}

export interface DailyLeaderboardResult {
  rounds: number;
  rows: DailyRow[];
  configured: boolean;
}

export async function getDailyLeaderboard(
  date: string,
  viewerSessionId?: string | null
): Promise<DailyLeaderboardResult> {
  if (!isSupabaseConfigured()) {
    return { rounds: 0, rows: [], configured: false };
  }

  try {
    const supabase = getServiceSupabase();

    // These three don't depend on each other - fire them together.
    const [resultsRes, modeRows, gameRes] = await Promise.all([
      supabase
        .from("game_results")
        .select("session_id, score, time_seconds, lives_remaining, stars")
        .eq("play_date", date)
        .returns<
          {
            session_id: string;
            score: number | null;
            time_seconds: number | null;
            lives_remaining: number | null;
            stars: number | null;
          }[]
        >(),
      safeModeRows(supabase, date),
      supabase.from("daily_games").select("id").eq("play_date", date).maybeSingle<{ id: string }>(),
    ]);
    if (resultsRes.error) throw resultsRes.error;

    const rows = resultsRes.data ?? [];

    const modeSum = new Map<string, number>();
    for (const m of modeRows) {
      modeSum.set(m.session_id, (modeSum.get(m.session_id) ?? 0) + (m.score ?? 0));
    }

    // Players who only played an extra mode still make the board.
    const chainSessions = new Set(rows.map((r) => r.session_id));
    for (const sid of modeSum.keys()) {
      if (!chainSessions.has(sid)) {
        rows.push({ session_id: sid, score: 0, time_seconds: null, lives_remaining: 0, stars: 0 });
      }
    }

    if (rows.length === 0) {
      return { rounds: 0, rows: [], configured: true };
    }

    const sessionIds = Array.from(new Set(rows.map((r) => r.session_id)));
    const game = gameRes.data;

    // These two don't depend on each other either.
    const [profilesRes, cardsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("session_id, username")
        .in("session_id", sessionIds)
        .returns<{ session_id: string; username: string | null }[]>(),
      game
        ? supabase.from("game_cards").select("id", { count: "exact", head: true }).eq("game_id", game.id)
        : Promise.resolve({ count: 0 }),
    ]);

    const nameBy = new Map(
      (profilesRes.data ?? []).filter((p) => p.username).map((p) => [p.session_id, p.username as string])
    );
    const rounds = Math.max(0, (cardsRes.count ?? 0) - 1);

    const ranked: DailyRow[] = rows
      .map((r) => {
        const reached = r.score ?? 0;
        const hearts = r.stars != null ? r.stars : heartsFor(r.lives_remaining ?? 0);
        const timeSeconds = r.time_seconds;
        return {
          session_id: r.session_id,
          reached,
          hearts,
          timeSeconds,
          score: dailyScore(reached, hearts, timeSeconds ?? 0) + (modeSum.get(r.session_id) ?? 0),
        };
      })
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : (a.timeSeconds ?? 1e9) - (b.timeSeconds ?? 1e9)))
      .slice(0, 100)
      .map((r, i) => {
        const username = nameBy.get(r.session_id);
        return {
          rank: i + 1,
          name: username ?? unknownName(r.session_id),
          anon: !username,
          score: r.score,
          reached: r.reached,
          hearts: r.hearts,
          timeSeconds: r.timeSeconds,
          you: Boolean(viewerSessionId) && r.session_id === viewerSessionId,
        };
      });

    return { rounds, rows: ranked, configured: true };
  } catch (e) {
    console.error("[daily] leaderboard query failed:", e);
    return { rounds: 0, rows: [], configured: true };
  }
}
