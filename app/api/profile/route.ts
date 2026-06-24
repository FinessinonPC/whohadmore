import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { monthPeriod, todayISO } from "@/lib/date";
import type { Profile } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// GET /api/profile?session_id=...  ->  { profile, rank }
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ profile: null, rank: null });
  }

  const session_id = new URL(req.url).searchParams.get("session_id");
  if (!session_id) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle<Profile>();

  if (!profile) {
    return NextResponse.json({ profile: null, rank: null });
  }

  // Reset the displayed monthly tally if the stored period is stale.
  const period = monthPeriod(todayISO());
  const effectiveMonthly = profile.monthly_period === period ? profile.monthly_score : 0;

  // Rank all-time, by total XP (only meaningful once they've earned some).
  let rank: number | null = null;
  if (profile.xp > 0) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("xp", profile.xp);
    rank = (count ?? 0) + 1;
  }

  return NextResponse.json({
    profile: { ...profile, monthly_score: effectiveMonthly },
    rank,
  });
}
