import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, todayISO } from "@/lib/date";
import { dailyScore, heartsFor, type DailyRow } from "@/lib/leaderboard";
import { hashSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

// A stable, unique-ish display name for a profile-less player, derived from
// their session id so it's the same every day (e.g. "Unknown4821").
function unknownName(sessionId: string): string {
  return `Unknown${1000 + (hashSeed(sessionId) % 9000)}`;
}

// GET /api/leaderboard/daily?date=YYYY-MM-DD&session=<id>
// Everyone who played that day's game (signed in or not), ranked by how far
// they got, then who was fastest. Profile-less players show as "Anonymous".
// Scoped to one date, so it naturally resets when the daily game rolls over.
//
// `configured` in the response tells you whether a backend is even wired up:
// when it's false the deployment is in demo mode (Supabase env vars missing for
// this environment) and the board will always be empty.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const param = url.searchParams.get("date");
  const viewer = url.searchParams.get("session");
  const date = param && isValidISODate(param) ? param : todayISO();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ date, rounds: 0, rows: [], configured: false });
  }

  try {
    const supabase = getServiceSupabase();

    // Every result for the day - one per session, signed in or anonymous.
    const { data: results, error: resultsError } = await supabase
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
      >();
    if (resultsError) throw resultsError;

    const rows = results ?? [];

    // Extra-mode points (Rank Five, Pinpoint) fold into the daily total.
    // Best-effort: if the game_mode_results table doesn't exist yet, the
    // board simply shows chain-only scores.
    const modeSum = new Map<string, number>();
    try {
      const { data: modeRows } = await supabase
        .from("game_mode_results")
        .select("session_id, score")
        .eq("play_date", date)
        .returns<{ session_id: string; score: number | null }[]>();
      for (const m of modeRows ?? []) {
        modeSum.set(m.session_id, (modeSum.get(m.session_id) ?? 0) + (m.score ?? 0));
      }
    } catch {
      /* table not created yet - chain-only board */
    }

    // Players who only played an extra mode still make the board.
    const chainSessions = new Set(rows.map((r) => r.session_id));
    for (const sid of modeSum.keys()) {
      if (!chainSessions.has(sid)) {
        rows.push({ session_id: sid, score: 0, time_seconds: null, lives_remaining: 0, stars: 0 });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ date, rounds: 0, rows: [], configured: true });
    }

    // Names for sessions that have claimed a username.
    const sessionIds = Array.from(new Set(rows.map((r) => r.session_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("session_id, username")
      .in("session_id", sessionIds)
      .returns<{ session_id: string; username: string | null }[]>();
    const nameBy = new Map(
      (profiles ?? []).filter((p) => p.username).map((p) => [p.session_id, p.username as string])
    );

    // Rounds, for the "X / Y" display.
    let rounds = 0;
    const { data: game } = await supabase
      .from("daily_games")
      .select("id")
      .eq("play_date", date)
      .maybeSingle<{ id: string }>();
    if (game) {
      const { count } = await supabase
        .from("game_cards")
        .select("id", { count: "exact", head: true })
        .eq("game_id", game.id);
      rounds = Math.max(0, (count ?? 0) - 1);
    }

    const ranked: DailyRow[] = rows
      .map((r) => {
        const reached = r.score ?? 0;
        // `stars` already stores hearts banked; fall back to lives for old rows.
        const hearts = r.stars != null ? r.stars : heartsFor(r.lives_remaining ?? 0);
        const timeSeconds = r.time_seconds;
        return {
          session_id: r.session_id,
          reached,
          hearts,
          timeSeconds,
          score:
            dailyScore(reached, hearts, timeSeconds ?? 0) +
            (modeSum.get(r.session_id) ?? 0),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.timeSeconds ?? 1e9) - (b.timeSeconds ?? 1e9);
      })
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
          you: Boolean(viewer) && r.session_id === viewer,
        };
      });

    return NextResponse.json({ date, rounds, rows: ranked, configured: true });
  } catch (e) {
    console.error("[daily] leaderboard query failed:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ date, rounds: 0, rows: [], configured: true, error: "query_failed", detail });
  }
}
