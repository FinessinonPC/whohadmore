import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { monthPeriod, previousISODate, todayISO } from "@/lib/date";
import {
  dailyScore,
  earnedAchievementIds,
  heartsFor,
  levelFromXp,
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

  // Already have an account for this email? Log them in on this device.
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .maybeSingle<Profile>();

  if (existing) {
    if (existing.session_id !== session_id) {
      await supabase
        .from("profiles")
        .update({ session_id, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return NextResponse.json({ profile: { ...existing, session_id }, loggedIn: true });
  }

  // No account yet — first ask for a username, then create the profile.
  if (!username) {
    return NextResponse.json({ needsUsername: true, email });
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "2–20 chars: letters, numbers, spaces, _ or -." },
      { status: 400 }
    );
  }

  // Backfill stats from this device's play history so the first game counts.
  const today = todayISO();
  const period = monthPeriod(today);
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
  const lastPlayed = rows.length ? rows.map((r) => r.play_date).sort().slice(-1)[0] : null;

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
      email,
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
      // Either the username or (rarely) the email is already taken.
      return NextResponse.json(
        { error: "That username is taken — try another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: created });
}
