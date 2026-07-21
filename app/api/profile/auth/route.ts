import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { monthPeriod, previousISODate, todayISO } from "@/lib/date";
import {
  dailyScore,
  earnedAchievementIds,
  heartsFor,
  levelFromXp,
  modeXp,
  type Profile,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[A-Za-z0-9 _-]{2,20}$/;
const UNIQUE_VIOLATION = "23505";

interface Body {
  access_token?: string;
  session_id?: string;
  username?: string;
}

interface ResultRow {
  play_date: string;
  points: number | null;
  stars: number | null;
  score: number | null;
  time_seconds: number | null;
  lives_remaining: number | null;
}

const RESULT_COLUMNS = "play_date, points, stars, score, time_seconds, lives_remaining";

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

/** Roll a session's full result history up into profile stats. Idempotent: the
 *  same rows always produce the same totals (points/stars are stored per game). */
function aggregate(rows: ResultRow[], modeRows: { score: number | null }[], today: string, period: string) {
  const dates = new Set(rows.map((r) => r.play_date));
  // XP = Chain's stored (streak-boosted) points + each quick game's flat XP, so
  // the rolled-up total matches what was credited live on every game played.
  const xp =
    rows.reduce((s, r) => s + (r.points ?? 0), 0) +
    modeRows.reduce((s, r) => s + modeXp(r.score ?? 0), 0);
  const totalStars = rows.reduce((s, r) => s + (r.stars ?? 0), 0);
  let totalScore = rows.reduce(
    (s, r) =>
      s + dailyScore(r.score ?? 0, r.stars ?? heartsFor(r.lives_remaining ?? 0), r.time_seconds ?? 0),
    0
  );
  totalScore += modeRows.reduce((s, r) => s + (r.score ?? 0), 0);
  
  const monthlyScore = rows
    .filter((r) => r.play_date.startsWith(period))
    .reduce((s, r) => s + (r.points ?? 0), 0);
  const daysPlayed = dates.size;
  const streak = computeStreak(dates, today);
  const lastPlayed = rows.length ? rows.map((r) => r.play_date).sort().slice(-1)[0] : null;
  // "Perfect" is awarded during live play (backfill can't know each game's
  // round count). Streak/level/first-game achievements resolve from the totals.
  const achievements = earnedAchievementIds({
    daysPlayed,
    currentStreak: streak,
    level: levelFromXp(xp),
    clearedThisGame: false,
  });
  return { xp, totalStars, totalScore, monthlyScore, daysPlayed, streak, lastPlayed, achievements };
}

// POST /api/profile/auth
// Called after the client has verified an email OTP. The Supabase session
// access_token proves ownership of the email. We then either log the player in
// (an account already exists for that email) or, with a username, create one.
export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Accounts aren't configured." }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { access_token, session_id } = body;
  const username = (body.username ?? "").trim();
  if (!access_token || !session_id) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  // Verify the email from the Supabase session token (proves OTP success).
  const { data: userData, error: userErr } = await getServerSupabase().auth.getUser(access_token);
  const email = userData?.user?.email ?? null;
  if (userErr || !email) {
    return NextResponse.json({ error: "Email not verified." }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const today = todayISO();
  const period = monthPeriod(today);

  // Already have an account for this email? Log them in.
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .maybeSingle<Profile>();

  if (existing) {
    const canonical = existing.session_id;

    // Same device as the account already - nothing to merge or recompute.
    if (canonical === session_id) {
      return NextResponse.json({ profile: existing, loggedIn: true });
    }

    // Merge any plays made on THIS device (its anonymous session, pre-login)
    // into the account's canonical session - so the game they just finished
    // counts and is attributed to their username, not orphaned.
    const { data: canonRows } = await supabase
      .from("game_results")
      .select("play_date")
      .eq("session_id", canonical)
      .returns<{ play_date: string }[]>();
    const canonDates = new Set((canonRows ?? []).map((r) => r.play_date));

    const { data: curRows } = await supabase
      .from("game_results")
      .select("id, play_date")
      .eq("session_id", session_id)
      .returns<{ id: string; play_date: string }[]>();
    const dup = (curRows ?? []).filter((r) => canonDates.has(r.play_date)).map((r) => r.id);
    const move = (curRows ?? []).filter((r) => !canonDates.has(r.play_date)).map((r) => r.id);

    // The account already has those days - drop this device's duplicates.
    if (dup.length) await supabase.from("game_results").delete().in("id", dup);
    // New days for the account - re-point them to the canonical session.
    if (move.length) {
      await supabase.from("game_results").update({ session_id: canonical }).in("id", move);
    }

    // Do the SAME for the quick games (Duality/Word/Mini) so their scores follow
    // the player into their account instead of being stranded on the anonymous
    // session - otherwise the profile's per-game stats look empty after sign-in.
    // Keyed by (play_date, mode) to respect the table's unique constraint.
    const { data: canonModes } = await supabase
      .from("game_mode_results")
      .select("play_date, mode")
      .eq("session_id", canonical)
      .returns<{ play_date: string; mode: string }[]>();
    const canonModeKeys = new Set((canonModes ?? []).map((r) => `${r.play_date}:${r.mode}`));

    const { data: curModes } = await supabase
      .from("game_mode_results")
      .select("id, play_date, mode")
      .eq("session_id", session_id)
      .returns<{ id: string; play_date: string; mode: string }[]>();
    const modeDup = (curModes ?? [])
      .filter((r) => canonModeKeys.has(`${r.play_date}:${r.mode}`))
      .map((r) => r.id);
    const modeMove = (curModes ?? [])
      .filter((r) => !canonModeKeys.has(`${r.play_date}:${r.mode}`))
      .map((r) => r.id);
    if (modeDup.length) await supabase.from("game_mode_results").delete().in("id", modeDup);
    if (modeMove.length) {
      await supabase.from("game_mode_results").update({ session_id: canonical }).in("id", modeMove);
    }

    // Recompute the rolled-up stats from the account's full history. This
    // credits the freshly merged plays.
    const { data: allRows } = await supabase
      .from("game_results")
      .select(RESULT_COLUMNS)
      .eq("session_id", canonical)
      .returns<ResultRow[]>();
    const rows = allRows ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ profile: existing, loggedIn: true });
    }

    const { data: allModes } = await supabase
      .from("game_mode_results")
      .select("score")
      .eq("session_id", canonical)
      .returns<{ score: number | null }[]>();
    const modeRows = allModes ?? [];

    const agg = aggregate(rows, modeRows, today, period);
    const { data: updated } = await supabase
      .from("profiles")
      .update({
        xp: agg.xp,
        total_score: agg.totalScore,
        total_stars: agg.totalStars,
        days_played: agg.daysPlayed,
        current_streak: agg.streak,
        longest_streak: Math.max(existing.longest_streak, agg.streak),
        last_played_date: agg.lastPlayed,
        monthly_score: agg.monthlyScore,
        monthly_period: period,
        achievements: Array.from(new Set([...existing.achievements, ...agg.achievements])),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single<Profile>();

    return NextResponse.json({ profile: updated ?? existing, loggedIn: true });
  }

  // No account yet - first ask for a username, then create the profile.
  if (!username) {
    return NextResponse.json({ needsUsername: true, email });
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "2-20 chars: letters, numbers, spaces, _ or -." },
      { status: 400 }
    );
  }

  // Backfill stats from this device's play history so the first game counts.
  const { data: results } = await supabase
    .from("game_results")
    .select(RESULT_COLUMNS)
    .eq("session_id", session_id)
    .returns<ResultRow[]>();
  const { data: modeResults } = await supabase
    .from("game_mode_results")
    .select("score")
    .eq("session_id", session_id)
    .returns<{ score: number | null }[]>();
  const agg = aggregate(results ?? [], modeResults ?? [], today, period);

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      session_id,
      username,
      email,
      xp: agg.xp,
      total_score: agg.totalScore,
      total_stars: agg.totalStars,
      days_played: agg.daysPlayed,
      current_streak: agg.streak,
      longest_streak: agg.streak,
      last_played_date: agg.lastPlayed,
      monthly_score: agg.monthlyScore,
      monthly_period: period,
      achievements: agg.achievements,
    })
    .select("*")
    .single<Profile>();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Either the username or (rarely) the email is already taken.
      return NextResponse.json(
        { error: "That username is taken - try another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: created });
}
