import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { checkAdmin } from "@/lib/adminAuth";
import { chainDailyScore } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

// ============================================================================
// Recompute every profile's lifetime tallies from the games actually on record.
//
// Two things make this the repair tool rather than a footgun:
//
// 1. It uses the SAME formula live play uses - chainDailyScore(correct, rounds)
//    per Chain day plus each quick game's score. The old version summed
//    dailyScore(correct, hearts, time), which Chain hasn't scored on since
//    hearts and the clock were dropped, so running it produced a third number
//    that agreed with neither the leaderboard nor the profile.
//
// 2. It NEVER LOWERS a tally. Points earned cannot be un-earned, so a missing
//    row can only ever mean "not counted yet", never "didn't happen". That is
//    what makes it safe to press while Chain rows are still coming back from
//    players' devices: each press raises whoever has been restored and leaves
//    everyone else exactly as they were. Press it as often as you like.
// ============================================================================

const DEFAULT_ROUNDS = 10;

interface ChainRow {
  session_id: string;
  play_date: string;
  score: number | null;
  stars: number | null;
  rounds?: number | null;
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, session_id, total_score, total_stars, days_played, longest_streak, monthly_score");
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Everything in three reads rather than two per profile.
  const [{ data: chainRaw }, { data: modeRaw }, { data: games }] = await Promise.all([
    supabase.from("game_results").select("*"),
    supabase.from("game_mode_results").select("session_id, play_date, score"),
    supabase.from("daily_games").select("id, play_date"),
  ]);

  // Rounds for Chain rows that predate the stored column: that day's cards - 1.
  const roundsByDate = new Map<string, number>();
  if (games?.length) {
    const { data: cards } = await supabase.from("game_cards").select("game_id");
    const countByGame = new Map<string, number>();
    for (const c of (cards ?? []) as { game_id: string }[]) {
      countByGame.set(c.game_id, (countByGame.get(c.game_id) ?? 0) + 1);
    }
    for (const g of games as { id: string; play_date: string }[]) {
      const n = countByGame.get(g.id) ?? 0;
      if (n >= 2) roundsByDate.set(g.play_date, n - 1);
    }
  }

  const chainBySession = new Map<string, ChainRow[]>();
  for (const r of (chainRaw ?? []) as ChainRow[]) {
    (chainBySession.get(r.session_id) ?? chainBySession.set(r.session_id, []).get(r.session_id)!).push(r);
  }
  const modeBySession = new Map<string, { play_date: string; score: number | null }[]>();
  for (const r of (modeRaw ?? []) as { session_id: string; play_date: string; score: number | null }[]) {
    (modeBySession.get(r.session_id) ?? modeBySession.set(r.session_id, []).get(r.session_id)!).push(r);
  }

  const period = new Date().toISOString().slice(0, 7);
  let raised = 0;
  let unchanged = 0;

  for (const p of profiles ?? []) {
    const chain = chainBySession.get(p.session_id) ?? [];
    const modes = modeBySession.get(p.session_id) ?? [];

    const roundsFor = (r: ChainRow) =>
      (typeof r.rounds === "number" && r.rounds > 0 ? r.rounds : null) ??
      roundsByDate.get(r.play_date) ??
      DEFAULT_ROUNDS;

    const total =
      chain.reduce((s, r) => s + chainDailyScore(r.score ?? 0, roundsFor(r)), 0) +
      modes.reduce((s, r) => s + (r.score ?? 0), 0);
    const stars = chain.reduce((s, r) => s + (r.stars ?? 0), 0);
    const days = new Set([...chain, ...modes].map((r) => r.play_date)).size;
    const monthly =
      chain
        .filter((r) => r.play_date.startsWith(period))
        .reduce((s, r) => s + chainDailyScore(r.score ?? 0, roundsFor(r)), 0) +
      modes.filter((r) => r.play_date.startsWith(period)).reduce((s, r) => s + (r.score ?? 0), 0);

    // Raise only. Streaks and last_played_date are left alone entirely - live
    // play owns those, and a missing row must never break someone's streak.
    const next = {
      total_score: Math.max(total, p.total_score ?? 0),
      total_stars: Math.max(stars, p.total_stars ?? 0),
      days_played: Math.max(days, p.days_played ?? 0),
      monthly_score: Math.max(monthly, p.monthly_score ?? 0),
    };

    const changed =
      next.total_score !== (p.total_score ?? 0) ||
      next.total_stars !== (p.total_stars ?? 0) ||
      next.days_played !== (p.days_played ?? 0) ||
      next.monthly_score !== (p.monthly_score ?? 0);

    if (!changed) {
      unchanged += 1;
      continue;
    }
    // `xp` is legacy and no longer read; keep it mirrored so nothing stale
    // surfaces if an old cached client asks for it.
    await supabase
      .from("profiles")
      .update({ ...next, xp: next.total_score, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    raised += 1;
  }

  return NextResponse.json({
    success: true,
    totalProfiles: profiles?.length ?? 0,
    raised,
    unchanged,
  });
}
