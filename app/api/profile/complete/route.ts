import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, monthPeriod, previousISODate, todayISO } from "@/lib/date";
import {
  chainDailyScore,
  earnedAchievementIds,
  levelFromXp,
  pointsForGame,
  type Profile,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

interface Body {
  session_id?: string;
  play_date?: string;
  reached?: number; // how many correct
  rounds?: number;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const { session_id, play_date } = body;
  const reached = Number(body.reached);
  const rounds = Number(body.rounds);

  if (!Number.isFinite(reached) || !Number.isFinite(rounds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cleared = rounds > 0 && reached >= rounds; // every call right

  // No backend configured (demo mode): still report the (streak-free) XP for
  // display. `demo: true` makes this state visible - in this mode nothing is
  // recorded, so the daily leaderboard will be empty no matter what.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      profile: null,
      pointsEarned: pointsForGame(reached, rounds, 0),
      demo: true,
    });
  }

  if (!session_id || !play_date || !isValidISODate(play_date)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const today = todayISO();
  const period = monthPeriod(today);
  const isToday = play_date === today;

  // Has this session already completed this date? (idempotent stats)
  const { data: existing } = await supabase
    .from("game_results")
    .select("id")
    .eq("session_id", session_id)
    .eq("play_date", play_date)
    .maybeSingle<{ id: string }>();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle<Profile>();

  // Already counted - return current standing untouched.
  if (existing) {
    return NextResponse.json({ profile: profile ?? null, pointsEarned: 0, alreadyPlayed: true });
  }

  // Streak only advances on the live daily game, not archive replays.
  let nextStreak = profile?.current_streak ?? 0;
  if (profile && isToday) {
    nextStreak =
      profile.last_played_date === previousISODate(play_date)
        ? profile.current_streak + 1
        : profile.last_played_date === play_date
          ? profile.current_streak
          : 1;
  }
  const streakForPoints = profile ? (isToday ? nextStreak : profile.current_streak) : 0;
  const pts = pointsForGame(reached, rounds, streakForPoints);

  // Record the result with the credited points (also enables backfill). This
  // row is what the daily leaderboard reads, so a silent failure here is exactly
  // why the board can look empty - surface it instead of swallowing it. The
  // hearts/time columns are retained for schema compatibility but unused now.
  const { error: insertError } = await supabase.from("game_results").insert({
    play_date,
    session_id,
    score: reached,
    lives_remaining: null,
    completed: true,
    time_seconds: 0,
    points: pts,
    stars: 0,
  });
  if (insertError) {
    console.error("[complete] game_results insert failed:", insertError);
    return NextResponse.json({
      profile: profile ?? null,
      pointsEarned: 0,
      error: "record_failed",
      code: insertError.code,
      detail: insertError.message,
    });
  }

  if (!profile) {
    return NextResponse.json({ profile: null, pointsEarned: pts });
  }

  const xp = profile.xp + pts;
  const level = levelFromXp(xp);
  const daysPlayed = profile.days_played + 1;
  const currentStreak = isToday ? nextStreak : profile.current_streak;
  const longestStreak = Math.max(profile.longest_streak, currentStreak);
  const monthlyScore = (profile.monthly_period === period ? profile.monthly_score : 0) + pts;
  // All-time score: streak-free sum of each day's Chain points (0–1000). Only XP
  // carries the streak bonus; the competitive boards don't.
  const totalScore = (profile.total_score ?? 0) + chainDailyScore(reached, rounds);

  const earned = earnedAchievementIds({ daysPlayed, currentStreak, level, clearedThisGame: cleared });

  // Century Club: 100 recorded games across chain + the quick games. Counted
  // here too (not just in /api/modes/complete) so a chain-only player can
  // still cross the line. Best-effort - a failed count never blocks the update.
  try {
    const { count: chainCount } = await supabase
      .from("game_results")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session_id);
    const { count: modeCount } = await supabase
      .from("game_mode_results")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session_id);
    if ((chainCount ?? 0) + (modeCount ?? 0) >= 100) earned.push("century");
  } catch {
    /* decorative */
  }

  const merged = Array.from(new Set([...profile.achievements, ...earned]));
  const newAchievements = merged.filter((a) => !profile.achievements.includes(a));

  const { data: updated } = await supabase
    .from("profiles")
    .update({
      xp,
      total_score: totalScore,
      days_played: daysPlayed,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_played_date: isToday ? play_date : profile.last_played_date,
      monthly_score: monthlyScore,
      monthly_period: period,
      achievements: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", session_id)
    .select("*")
    .single<Profile>();

  return NextResponse.json({
    profile: updated ?? profile,
    pointsEarned: pts,
    newAchievements,
  });
}
