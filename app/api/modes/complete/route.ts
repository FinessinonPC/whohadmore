import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate, monthPeriod, todayISO } from "@/lib/date";
import { applyRollup } from "@/lib/profileRollup";

export const dynamic = "force-dynamic";

// Per-mode score ceilings (see docs/BLUEPRINT.md §3 - every quick game caps
// around 1000 so no mode dominates the combined total).
const MODE_MAX: Record<string, number> = {
  duality: 1000,
  word: 1000,
  mini: 1000,
};

/** Clamp an optional numeric detail field; undefined/garbage becomes null. */
function cleanNumber(v: unknown, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
}

// POST /api/modes/complete - record a finished extra-mode game (rank/pinpoint).
// First play counts: duplicate submissions for the same session+date+mode are
// ignored. Best-effort by design - if the game_mode_results table hasn't been
// created yet, this quietly no-ops so play is never blocked.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      session_id?: string;
      play_date?: string;
      mode?: string;
      score?: number;
      clean?: boolean; // solved with no mistakes/checks - drives "perfect" badges
      seconds?: number; // solve time (duality/mini)
      moves?: number; // word: guesses · duality: mistakes · mini: checks
      won?: boolean; // word: solved · duality: all pairs · mini: no reveal
    };
    const { session_id, play_date, mode, score, clean } = body;

    const maxScore = mode ? MODE_MAX[mode] : undefined;
    if (
      !session_id ||
      !play_date ||
      !isValidISODate(play_date) ||
      !mode ||
      maxScore === undefined ||
      typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > maxScore
    ) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, recorded: false });

    const supabase = getServiceSupabase();

    // First play counts - a second submission for the same day+mode is ignored
    // (and reported as such), so scores can't be farmed by replaying.
    const { data: existing } = await supabase
      .from("game_mode_results")
      .select("id")
      .eq("session_id", session_id)
      .eq("play_date", play_date)
      .eq("mode", mode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, recorded: false });
    }

    const seconds = cleanNumber(body.seconds, 86400);
    const moves = cleanNumber(body.moves, 100);
    const won = typeof body.won === "boolean" ? body.won : null;

    const baseRow = { play_date, session_id, mode, score: Math.round(score) };
    const upsertOpts = { onConflict: "play_date,session_id,mode", ignoreDuplicates: true } as const;

    // Try the detail-rich row first; if migration 0007 hasn't been run the
    // unknown columns make PostgREST reject it, so retry score-only - recording
    // the play always beats recording the trivia about it.
    let { error } = await supabase
      .from("game_mode_results")
      .upsert(
        { ...baseRow, seconds, moves: moves === null ? null : Math.round(moves), won },
        upsertOpts
      );
    if (error) {
      ({ error } = await supabase.from("game_mode_results").upsert(baseRow, upsertOpts));
    }
    if (error) {
      console.error("[modes] record failed (is game_mode_results created?):", error.message);
      return NextResponse.json({ ok: true, recorded: false });
    }

    // Profile update - best-effort, never blocks recording. The shared rollup
    // recomputes XP, total score, days, streaks, monthly, and history-derived
    // achievements from ALL recorded games (archive included), so a quick game
    // counts everywhere Chain does. Skill badges that need this request's
    // context (clean/won/moves before the detail columns exist) ride along.
    try {
      const earned: string[] = [];
      if (mode === "duality" && clean) earned.push("duality_perfect");
      if (mode === "word" && score >= 800) earned.push("word_ace");
      if (mode === "word" && won && moves !== null && moves <= 2) earned.push("word_two");
      if (mode === "mini" && clean) earned.push("mini_clean");
      if (mode === "mini" && won && seconds !== null && seconds < 60) earned.push("mini_speed");
      if (score >= 1000) earned.push("thousand_club");

      const today = todayISO();
      await applyRollup(supabase, session_id, today, monthPeriod(today), {
        extraAchievements: earned,
      });
    } catch {
      /* profile rollup is derived state - recording already succeeded */
    }

    return NextResponse.json({ ok: true, recorded: true });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
