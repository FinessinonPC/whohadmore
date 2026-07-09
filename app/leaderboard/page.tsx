import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { levelFromXp, type LeaderboardRow } from "@/lib/leaderboard";

export const revalidate = 300; // Cache for 5 minutes

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top WhoHadMore players this month. Pick a username, build a streak, and climb the daily comparison game leaderboard.",
  alternates: { canonical: "/leaderboard" },
};

export default async function LeaderboardPage() {
  let rows: LeaderboardRow[] = [];

  if (isSupabaseConfigured()) {
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

    rows = (data ?? []).map((r, i) => ({
      rank: i + 1,
      username: r.username,
      score: r.total_score,
      total_stars: r.total_stars,
      current_streak: r.current_streak,
      level: levelFromXp(r.xp),
    }));
  }

  return <LeaderboardView initialRows={rows} />;
}
