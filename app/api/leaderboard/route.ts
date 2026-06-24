import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { levelFromXp, type LeaderboardRow } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard  ->  { rows } — top players all-time, by total XP.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ rows: [] });
  }

  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("username, total_stars, current_streak, xp")
    .gt("xp", 0)
    .not("username", "is", null)
    .order("xp", { ascending: false })
    .limit(50)
    .returns<
      {
        username: string;
        total_stars: number;
        current_streak: number;
        xp: number;
      }[]
    >();

  const rows: LeaderboardRow[] = (data ?? []).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    score: r.xp,
    total_stars: r.total_stars,
    current_streak: r.current_streak,
    level: levelFromXp(r.xp),
  }));

  return NextResponse.json({ rows });
}
