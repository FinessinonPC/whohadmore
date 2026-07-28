import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, monthPeriod, previousISODate, todayISO } from "@/lib/date";
import { heartsFor, pointsForGame, type Profile } from "@/lib/leaderboard";
import { computeRollup } from "@/lib/profileRollup";

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
      { error: "2-20 chars: letters, numbers, spaces, _ or -." },
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

  // New profile - backfill stats from this session's history.
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
      const row = {
        play_date: lastGame.play_date,
        session_id,
        score: lastGame.reached,
        lives_remaining: Number.isFinite(lastGame.lives) ? lastGame.lives : null,
        completed: true,
        time_seconds: time,
        points: pointsForGame(lastGame.reached, lastGame.rounds, 0),
        stars: heartsFor(lastGame.lives ?? 0),
      };
      // Store the round count when migration 0009 is live; retry bare if not.
      const { error: rowErr } = await supabase
        .from("game_results")
        .insert({ ...row, rounds: lastGame.rounds > 0 ? Math.round(lastGame.rounds) : null });
      if (rowErr) await supabase.from("game_results").insert(row);
    }
  }

  // One shared rollup tallies the whole history - chain + quick games, live
  // and archive - exactly the way every game-complete keeps it up to date.
  const roll = await computeRollup(supabase, session_id, today, period);

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      session_id,
      username,
      xp: roll.xp,
      total_score: roll.totalScore,
      total_stars: roll.totalStars,
      days_played: roll.daysPlayed,
      current_streak: roll.currentStreak,
      longest_streak: Math.max(roll.longestRun, roll.currentStreak),
      last_played_date: roll.lastPlayed,
      monthly_score: roll.monthlyScore,
      monthly_period: period,
      achievements: roll.achievements,
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
