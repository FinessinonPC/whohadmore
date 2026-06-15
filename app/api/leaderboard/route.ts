import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { monthPeriod, todayISO } from "@/lib/date";
import { levelFromXp, type LeaderboardRow } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/leaderboard  ->  { period, rows } — top players this month.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ period: monthPeriod(todayISO()), rows: [] });
  }

  const period = monthPeriod(todayISO());
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("username, monthly_score, total_stars, current_streak, xp")
    .eq("monthly_period", period)
    .gt("monthly_score", 0)
    .not("username", "is", null)
    .order("monthly_score", { ascending: false })
    .limit(50)
    .returns<
      {
        username: string;
        monthly_score: number;
        total_stars: number;
        current_streak: number;
        xp: number;
      }[]
    >();

  const rows: LeaderboardRow[] = (data ?? []).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    monthly_score: r.monthly_score,
    total_stars: r.total_stars,
    current_streak: r.current_streak,
    level: levelFromXp(r.xp),
  }));

  return NextResponse.json({ period, rows });
}
