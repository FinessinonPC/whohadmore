import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { monthPeriod, todayISO } from "@/lib/date";
import type { Profile } from "@/lib/leaderboard";
import { applyRollup, computeRollup } from "@/lib/profileRollup";

export const dynamic = "force-dynamic";

// DELETE /api/profile  { session_id }  - permanently delete the account.
//
// The session id is the credential for every other write on this session's
// data (claiming a username, recording games), so it authorizes deletion too.
// Removes the profile row AND every game row tied to the session, then
// best-effort deletes the Supabase auth user holding the verified email - so
// nothing personal survives. Deleting an account that doesn't exist is fine:
// the game rows for an anonymous session still get wiped.
export async function DELETE(req: Request) {
  if (!isSupabaseConfigured()) {
    // Demo mode keeps nothing server-side - the client clears its own storage.
    return NextResponse.json({ ok: true, deleted: false });
  }

  let session_id: string | undefined;
  try {
    ({ session_id } = (await req.json()) as { session_id?: string });
  } catch {
    /* fall through to the validation below */
  }
  if (!session_id || typeof session_id !== "string") {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Grab the email before the profile row goes away (for the auth cleanup).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("session_id", session_id)
    .maybeSingle<{ id: string; email: string | null }>();

  // Order matters: game rows first, profile last, so a failure partway can be
  // retried by simply deleting again. Feedback votes and analytics events are
  // session-keyed too.
  const optional = new Set(["feedback", "analytics_events"]); // tables that may not be migrated yet
  const tables = ["feedback", "analytics_events", "game_mode_results", "game_results"] as const;
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("session_id", session_id);
    // A missing optional table shouldn't block account deletion.
    if (error && !optional.has(table)) {
      console.error(`[delete] ${table} wipe failed:`, error.message);
      return NextResponse.json({ error: "Couldn't delete your data - try again." }, { status: 500 });
    }
  }
  const { error: profileError } = await supabase.from("profiles").delete().eq("session_id", session_id);
  if (profileError) {
    console.error("[delete] profiles wipe failed:", profileError.message);
    return NextResponse.json({ error: "Couldn't delete your data - try again." }, { status: 500 });
  }

  // Best-effort: also remove the Supabase auth user that verified this email,
  // so the address itself is gone. Failure here never blocks the deletion the
  // player asked for - the account data is already removed.
  if (profile?.email) {
    try {
      const email = profile.email.toLowerCase();
      for (let page = 1; page <= 10; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (error || !data?.users?.length) break;
        const match = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
        if (match) {
          await supabase.auth.admin.deleteUser(match.id);
          break;
        }
        if (data.users.length < 200) break;
      }
    } catch {
      /* auth cleanup is best-effort */
    }
  }

  return NextResponse.json({ ok: true, deleted: true });
}

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

  // Recompute from history rather than trusting the stored columns. Those are
  // only rewritten when a game is recorded, so between plays they can be stale
  // - and any row last written under an older scoring rule stays wrong forever
  // until that player happens to finish another game. Recomputing on read makes
  // every account self-heal on its next profile load, with no backfill.
  const today = todayISO();
  const period = monthPeriod(today);
  const roll = await computeRollup(supabase, session_id, today, period);

  let fresh: Profile = {
    ...profile,
    total_score: roll.totalScore,
    total_stars: roll.totalStars,
    days_played: roll.daysPlayed,
    current_streak: roll.currentStreak,
    longest_streak: Math.max(profile.longest_streak ?? 0, roll.longestRun, roll.currentStreak),
    monthly_score: roll.monthlyScore,
    monthly_period: period,
  };

  // Only write when the stored row actually disagrees - a read shouldn't churn
  // the table, but a stale row shouldn't survive being looked at either. When
  // it does disagree, applyRollup's result is what we return: it also merges
  // history-derived achievements, which the projection above doesn't.
  const stale =
    profile.total_score !== fresh.total_score ||
    profile.monthly_score !== fresh.monthly_score ||
    profile.monthly_period !== fresh.monthly_period ||
    profile.days_played !== fresh.days_played ||
    profile.current_streak !== fresh.current_streak ||
    profile.longest_streak !== fresh.longest_streak;
  if (stale) {
    const { profile: written } = await applyRollup(supabase, session_id, today, period);
    if (written) fresh = written as unknown as Profile;
  }

  // Rank all-time, by total points (only meaningful once > 0).
  let rank: number | null = null;
  if (fresh.total_score > 0) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("total_score", fresh.total_score);
    rank = (count ?? 0) + 1;
  }

  return NextResponse.json({ profile: fresh, rank });
}
