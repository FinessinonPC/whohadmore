import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { checkAdmin } from "@/lib/adminAuth";
import { dailyScore, heartsFor, type Profile } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  // Get all profiles
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("*");

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  let updatedCount = 0;

  for (const profile of profiles) {
    const canonical = profile.session_id;

    // Get chain games
    const { data: chainRows } = await supabase
      .from("game_results")
      .select("score, stars, lives_remaining, time_seconds")
      .eq("session_id", canonical);

    // Get mode games
    const { data: modeRows } = await supabase
      .from("game_mode_results")
      .select("score")
      .eq("session_id", canonical);

    const cRows = chainRows ?? [];
    const mRows = modeRows ?? [];

    let newTotalScore = cRows.reduce(
      (s, r) =>
        s + dailyScore(r.score ?? 0, r.stars ?? heartsFor(r.lives_remaining ?? 0), r.time_seconds ?? 0),
      0
    );

    newTotalScore += mRows.reduce((s, r) => s + (r.score ?? 0), 0);

    if (profile.total_score !== newTotalScore) {
      await supabase
        .from("profiles")
        .update({ total_score: newTotalScore })
        .eq("id", profile.id);
      
      updatedCount++;
    }
  }

  return NextResponse.json({ success: true, totalProfiles: profiles.length, updatedCount });
}
