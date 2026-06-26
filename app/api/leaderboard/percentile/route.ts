import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, todayISO } from "@/lib/date";
import { dailyScore, heartsFor } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/percentile?date=&session=&score=
// What % of OTHER players you outscored on this date - honest social proof for
// the result screen. The viewer's score is passed in (avoids the result-insert
// race) and the viewer's own session is excluded from the population.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const param = url.searchParams.get("date");
  const date = param && isValidISODate(param) ? param : todayISO();
  const viewer = url.searchParams.get("session") ?? "";
  const yourScore = Number(url.searchParams.get("score"));

  if (!isSupabaseConfigured() || !Number.isFinite(yourScore)) {
    return NextResponse.json({ percentile: null, total: 0 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
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

    const others = (data ?? []).filter((r) => r.session_id !== viewer);
    const total = others.length;
    if (total === 0) {
      return NextResponse.json({ percentile: null, total: 0 });
    }
    const beat = others.reduce((n, r) => {
      const hearts = r.stars != null ? r.stars : heartsFor(r.lives_remaining ?? 0);
      const s = dailyScore(r.score ?? 0, hearts, r.time_seconds ?? 0);
      return n + (s < yourScore ? 1 : 0);
    }, 0);
    return NextResponse.json({ percentile: Math.round((beat / total) * 100), total });
  } catch {
    return NextResponse.json({ percentile: null, total: 0 });
  }
}
