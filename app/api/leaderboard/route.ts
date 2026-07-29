import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { levelFromPoints, type LeaderboardRow } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard  ->  { rows } - top players all-time, by total score.
// Level comes from the SAME total_score, so a player's level and their board
// rank always agree - no matter when they started playing.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ rows: [] });
  }

  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("username, total_stars, current_streak, xp, total_score")
    .gt("total_score", 0)
    .not("username", "is", null)
    .order("total_score", { ascending: false })
    .limit(50)
    .returns<
      {
        username: string;
        total_stars: number;
        current_streak: number;
        xp: number;
        total_score: number;
      }[]
    >();

  const rows: LeaderboardRow[] = (data ?? []).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    score: r.total_score,
    total_stars: r.total_stars,
    current_streak: r.current_streak,
    level: levelFromPoints(r.total_score),
  }));

  return NextResponse.json({ rows });
}
