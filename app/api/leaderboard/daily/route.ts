import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, todayISO } from "@/lib/date";
import type { DailyRow } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/daily?date=YYYY-MM-DD — best players on that day's game,
// ranked by how far they got, then by who was fastest.
export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("date");
  const date = param && isValidISODate(param) ? param : todayISO();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ date, rounds: 0, rows: [] });
  }

  const supabase = getServiceSupabase();

  // Results for the day (one per session).
  const { data: results } = await supabase
    .from("game_results")
    .select("session_id, score, time_seconds")
    .eq("play_date", date)
    .returns<{ session_id: string; score: number | null; time_seconds: number | null }[]>();

  const rows = results ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ date, rounds: 0, rows: [] });
  }

  // Map sessions -> usernames (only signed-in players appear on the board).
  const sessionIds = Array.from(new Set(rows.map((r) => r.session_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("session_id, username")
    .in("session_id", sessionIds)
    .not("username", "is", null)
    .returns<{ session_id: string; username: string }[]>();

  const nameBy = new Map((profiles ?? []).map((p) => [p.session_id, p.username]));

  // Rounds for the "X / Y" display.
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
    .filter((r) => nameBy.has(r.session_id))
    .sort((a, b) => {
      const reachedDiff = (b.score ?? 0) - (a.score ?? 0);
      if (reachedDiff !== 0) return reachedDiff;
      return (a.time_seconds ?? 1e9) - (b.time_seconds ?? 1e9); // faster wins ties
    })
    .slice(0, 50)
    .map((r, i) => ({
      rank: i + 1,
      username: nameBy.get(r.session_id)!,
      reached: r.score ?? 0,
      timeSeconds: r.time_seconds,
    }));

  return NextResponse.json({ date, rounds, rows: ranked });
}
