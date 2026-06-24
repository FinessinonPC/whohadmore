import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, todayISO } from "@/lib/date";
import type { DailyRow } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/daily?date=YYYY-MM-DD&session=<id>
// Everyone who played that day's game (signed in or not), ranked by how far
// they got, then who was fastest. Profile-less players show as "Anonymous".
// Scoped to one date, so it naturally resets when the daily game rolls over.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const param = url.searchParams.get("date");
  const viewer = url.searchParams.get("session");
  const date = param && isValidISODate(param) ? param : todayISO();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ date, rounds: 0, rows: [] });
  }

  const supabase = getServiceSupabase();

  // Every result for the day — one per session, signed in or anonymous.
  const { data: results } = await supabase
    .from("game_results")
    .select("session_id, score, time_seconds")
    .eq("play_date", date)
    .returns<{ session_id: string; score: number | null; time_seconds: number | null }[]>();

  const rows = results ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ date, rounds: 0, rows: [] });
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
    .sort((a, b) => {
      const reachedDiff = (b.score ?? 0) - (a.score ?? 0);
      if (reachedDiff !== 0) return reachedDiff;
      return (a.time_seconds ?? 1e9) - (b.time_seconds ?? 1e9);
    })
    .slice(0, 100)
    .map((r, i) => ({
      rank: i + 1,
      name: nameBy.get(r.session_id) ?? "Anonymous",
      reached: r.score ?? 0,
      timeSeconds: r.time_seconds,
      you: Boolean(viewer) && r.session_id === viewer,
    }));

  return NextResponse.json({ date, rounds, rows: ranked });
}
