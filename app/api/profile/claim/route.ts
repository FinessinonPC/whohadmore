import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, monthPeriod, previousISODate, todayISO } from "@/lib/date";
import {
  dailyScore,
  earnedAchievementIds,
  heartsFor,
  levelFromXp,
  pointsForGame,
  type Profile,
} from "@/lib/leaderboard";

interface LastGame {
  play_date: string;
  reached: number;
  rounds: number;
  lives?: number;
  time_seconds?: number;
}

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[A-Za-z0-9 _-]{2,20}$/;
const UNIQUE_VIOLATION = "23505";

function computeStreak(dates: Set<string>, today: string): number {
  let cursor = dates.has(today)
    ? today
    : dates.has(previousISODate(today))
      ? previousISODate(today)
      : null;
  let streak = 0;
  while (cursor && dates.has(cursor)) {
    streak += 1;
    cursor = previousISODate(cursor);
  }
  return streak;
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Leaderboard isn't configured." }, { status: 503 });
  }

  let body: { session_id?: string; username?: string; lastGame?: LastGame };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session_id = body.session_id;
  const username = (body.username ?? "").trim();
  const lastGame = body.lastGame;
  if (!session_id) return NextResponse.json({ error: "Missing session" }, { status: 400 });
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "2–20 chars: letters, numbers, spaces, _ or -." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // Uniqueness is enforced by the DB (case-insensitive index on username), so we
  // just try the write and translate a unique-violation into a friendly message.
  // Any OTHER error is surfaced as-is (e.g. missing table / RLS) instead of being
  // mislabeled "taken".
  const { data: existing, error: existErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("session_id", session_id)
    .maybeSingle<Profile>();

  if (existErr) {
    return NextResponse.json({ error: existErr.message }, { status: 500 });
  }

  // Rename keeps stats.
  if (existing) {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("session_id", session_id)
      .select("*")
      .single<Profile>();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return NextResponse.json({ error: "That username is taken." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ profile: updated ?? existing });
  }

  // New profile — backfill stats from this session's history.
  const today = todayISO();
  const period = monthPeriod(today);

  // Make sure the game they JUST finished is recorded before we tally, so a
  // first game counts toward the new profile (guards against the async
  // complete-route insert not having landed yet). Idempotent per session+date.
  if (
    lastGame &&
    isValidISODate(lastGame.play_date) &&
    Number.isFinite(lastGame.reached) &&
    Number.isFinite(lastGame.rounds)
  ) {
    const { data: already } = await supabase
      .from("game_results")
      .select("id")
      .eq("session_id", session_id)
      .eq("play_date", lastGame.play_date)
      .maybeSingle<{ id: string }>();
    if (!already) {
      const time = Number.isFinite(lastGame.time_seconds) ? lastGame.time_seconds! : 0;
      await supabase.from("game_results").insert({
        play_date: lastGame.play_date,
        session_id,
        score: lastGame.reached,
        lives_remaining: Number.isFinite(lastGame.lives) ? lastGame.lives : null,
        completed: true,
        time_seconds: time,
        points: pointsForGame(lastGame.reached, lastGame.rounds, time, 0),
        stars: heartsFor(lastGame.lives ?? 0),
      });
    }
  }

  const { data: results } = await supabase
    .from("game_results")
    .select("play_date, points, stars, score, time_seconds, lives_remaining")
    .eq("session_id", session_id)
    .returns<
      {
        play_date: string;
        points: number | null;
        stars: number | null;
        score: number | null;
        time_seconds: number | null;
        lives_remaining: number | null;
      }[]
    >();

  const rows = results ?? [];
  const dates = new Set(rows.map((r) => r.play_date));
  const xp = rows.reduce((s, r) => s + (r.points ?? 0), 0);
  const totalStars = rows.reduce((s, r) => s + (r.stars ?? 0), 0);
  // Streak-free all-time score = sum of each game's daily score.
  const totalScore = rows.reduce(
    (s, r) =>
      s + dailyScore(r.score ?? 0, r.stars ?? heartsFor(r.lives_remaining ?? 0), r.time_seconds ?? 0),
    0
  );
  const monthlyScore = rows
    .filter((r) => r.play_date.startsWith(period))
    .reduce((s, r) => s + (r.points ?? 0), 0);
  const daysPlayed = dates.size;
  const streak = computeStreak(dates, today);
  const lastPlayed = rows.length
    ? rows.map((r) => r.play_date).sort().slice(-1)[0]
    : null;

  const achievements = earnedAchievementIds({
    daysPlayed,
    totalStars,
    currentStreak: streak,
    level: levelFromXp(xp),
    clearedThisGame: rows.some((r) => (r.stars ?? 0) >= 3),
    flawlessThisGame: false,
  });

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      session_id,
      username,
      xp,
      total_score: totalScore,
      total_stars: totalStars,
      days_played: daysPlayed,
      current_streak: streak,
      longest_streak: streak,
      last_played_date: lastPlayed,
      monthly_score: monthlyScore,
      monthly_period: period,
      achievements,
    })
    .select("*")
    .single<Profile>();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "That username is taken." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: created });
}
