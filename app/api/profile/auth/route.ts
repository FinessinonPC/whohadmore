import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { monthPeriod, todayISO } from "@/lib/date";
import { type Profile } from "@/lib/leaderboard";
import { applyRollup, computeRollup } from "@/lib/profileRollup";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[A-Za-z0-9 _-]{2,20}$/;
const UNIQUE_VIOLATION = "23505";

interface Body {
  access_token?: string;
  session_id?: string;
  username?: string;
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
    // session. Keyed by (play_date, mode) to respect the table's unique constraint.
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

    // One shared rollup rebuilds the account's stats from its full merged
    // history (chain + quick games, live and archive) - the same math every
    // game-complete runs, so nothing earned on this device is lost.
    const { profile: updated } = await applyRollup(supabase, canonical, today, period);

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

  // Backfill stats from this device's play history so every game already
  // played (chain + quick games) counts from the first moment.
  const roll = await computeRollup(supabase, session_id, today, period);

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      session_id,
      username,
      email,
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
