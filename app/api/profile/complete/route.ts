import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, monthPeriod, previousISODate, todayISO } from "@/lib/date";
import {
  computeStars,
  earnedAchievementIds,
  levelFromXp,
  pointsForGame,
  type Profile,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

interface Body {
  session_id?: string;
  play_date?: string;
  score?: number;
  best?: number;
  lives?: number;
  time_seconds?: number;
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ profile: null, pointsEarned: 0, stars: 0 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id, play_date } = body;
  const score = Number(body.score);
  const best = Number(body.best);
  const lives = Number(body.lives);
  const time = Number(body.time_seconds);

  if (!session_id || !play_date || !isValidISODate(play_date) || !Number.isFinite(score)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const today = todayISO();
  const period = monthPeriod(today);
  const isToday = play_date === today;

  const stars = computeStars(score, best, lives);
  const cleared = best > 0 && score >= best;
  const flawless = cleared && lives >= 3;

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

  // Already counted — return current standing untouched.
  if (existing) {
    return NextResponse.json({ profile: profile ?? null, pointsEarned: 0, stars, alreadyPlayed: true });
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
  const pts = pointsForGame(score, best, lives, streakForPoints);

  // Record the result with the credited points/stars (also enables backfill).
  await supabase.from("game_results").insert({
    play_date,
    session_id,
    score,
    lives_remaining: lives,
    completed: true,
    time_seconds: Number.isFinite(time) ? time : null,
    points: pts,
    stars,
  });

  if (!profile) {
    return NextResponse.json({ profile: null, pointsEarned: pts, stars });
  }

  const xp = profile.xp + pts;
  const level = levelFromXp(xp);
  const daysPlayed = profile.days_played + 1;
  const totalStars = profile.total_stars + stars;
  const currentStreak = isToday ? nextStreak : profile.current_streak;
  const longestStreak = Math.max(profile.longest_streak, currentStreak);
  const monthlyScore = (profile.monthly_period === period ? profile.monthly_score : 0) + pts;

  const merged = Array.from(
    new Set([
      ...profile.achievements,
      ...earnedAchievementIds({
        daysPlayed,
        totalStars,
        currentStreak,
        level,
        clearedThisGame: cleared,
        flawlessThisGame: flawless,
      }),
    ])
  );
  const newAchievements = merged.filter((a) => !profile.achievements.includes(a));

  const { data: updated } = await supabase
    .from("profiles")
    .update({
      xp,
      days_played: daysPlayed,
      total_stars: totalStars,
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
    stars,
    newAchievements,
  });
}
