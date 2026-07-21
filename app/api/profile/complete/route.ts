import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, monthPeriod, previousISODate, todayISO } from "@/lib/date";
import { pointsForGame, type Profile } from "@/lib/leaderboard";
import { applyRollup } from "@/lib/profileRollup";

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

  // The streak multiplier rewards the streak as it stands when the game is
  // played (today's play may extend it; archive plays use the current one).
  // The result is baked into the row's stored points, which is what makes
  // recomputing XP from history reproduce live play exactly.
  let streakForPoints = profile?.current_streak ?? 0;
  if (profile && isToday) {
    streakForPoints =
      profile.last_played_date === previousISODate(play_date)
        ? profile.current_streak + 1
        : profile.last_played_date === play_date
          ? profile.current_streak
          : 1;
  }
  const pts = pointsForGame(reached, rounds, streakForPoints);

  // Record the result - the row every other number is derived from. Store the
  // round count so recomputes score this game exactly as played; if migration
  // 0009 hasn't been run yet, retry without it (recording always wins).
  const baseRow = {
    play_date,
    session_id,
    score: reached,
    lives_remaining: null,
    completed: true,
    time_seconds: 0,
    points: pts,
    stars: 0,
  };
  let { error: insertError } = await supabase
    .from("game_results")
    .insert({ ...baseRow, rounds: rounds > 0 ? Math.round(rounds) : null });
  if (insertError) {
    ({ error: insertError } = await supabase.from("game_results").insert(baseRow));
  }
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

  // One shared rollup recomputes XP, totals, days, streaks, monthly, and
  // achievements from the full history - live play and sign-in can't drift.
  const { profile: updated, newAchievements } = await applyRollup(supabase, session_id, today, period);

  return NextResponse.json({
    profile: updated ?? profile,
    pointsEarned: pts,
    newAchievements,
  });
}
