import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { levelFromXp, type LeaderboardRow } from "@/lib/leaderboard";
import { getDailyLeaderboard } from "@/lib/dailyLeaderboard";
import { todayISO } from "@/lib/date";

export const revalidate = 60; // Today's board moves fast; refresh more often than all-time.

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top WhoHadMore players this month. Pick a username, build a streak, and climb the daily comparison game leaderboard.",
  alternates: { canonical: "/leaderboard" },
};

async function getAllTimeRows(): Promise<LeaderboardRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("username, total_stars, current_streak, xp, total_score")
    .gt("total_score", 0)
    .not("username", "is", null)
    .order("total_score", { ascending: false })
    .limit(50)
    .returns<
      { username: string; total_stars: number; current_streak: number; xp: number; total_score: number }[]
    >();

  return (data ?? []).map((r, i) => ({
    rank: i + 1,
    username: r.username,
    score: r.total_score,
    total_stars: r.total_stars,
    current_streak: r.current_streak,
    level: levelFromXp(r.xp),
  }));
}

export default async function LeaderboardPage() {
  // Both boards render with real data on the very first paint - no more
  // "no one has played" flash while the client fetches in the background.
  // The client still re-fetches daily (with the viewer's session) to mark
  // "you", but starts from real data instead of an empty list.
  const [rows, daily] = await Promise.all([getAllTimeRows(), getDailyLeaderboard(todayISO())]);

  return <LeaderboardView initialRows={rows} initialDaily={daily.rows} initialDailyRounds={daily.rounds} />;
}
