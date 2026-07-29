import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, todayISO } from "@/lib/date";
import { chainDailyScore } from "@/lib/leaderboard";
import { roundsByDate, roundsFor } from "@/lib/chainRounds";

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
      .select("session_id, score, rounds, play_date")
      .eq("play_date", date)
      .returns<
        { session_id: string; score: number | null; rounds: number | null; play_date: string }[]
      >();

    const others = (data ?? []).filter((r) => r.session_id !== viewer);
    const total = others.length;
    if (total === 0) {
      return NextResponse.json({ percentile: null, total: 0 });
    }
    // Same Chain formula as the boards and the profile.
    const byDate = await roundsByDate(supabase);
    const beat = others.reduce((n, r) => {
      const s = chainDailyScore(r.score ?? 0, roundsFor(r, byDate));
      return n + (s < yourScore ? 1 : 0);
    }, 0);
    return NextResponse.json({ percentile: Math.round((beat / total) * 100), total });
  } catch {
    return NextResponse.json({ percentile: null, total: 0 });
  }
}
