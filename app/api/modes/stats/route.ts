import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

interface ModeAgg {
  played: number;
  best: number;
  total: number;
}

/** One recorded quick-game result, with whatever detail the row carries.
 *  Rows written before migration 0007 have null seconds/moves/won. */
export interface ModeRow {
  mode: string;
  play_date: string;
  score: number;
  seconds: number | null;
  moves: number | null;
  won: boolean | null;
}

// GET /api/modes/stats?session=<id> - lifetime per-game data for the quick
// games (Chain's lifetime stats live on the profile itself). Returns both the
// rolled-up aggregates and the raw rows so the profile can compute
// game-specific stats (avg guesses, solve times) client-side, merged with any
// richer detail this device kept locally.
// Best-effort: an unmigrated game_mode_results table returns empty stats.
export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get("session");
  if (!session) return NextResponse.json({ error: "session required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ stats: {}, rows: [], configured: false });

  try {
    // select("*") instead of naming columns: rows written before migration
    // 0007 simply come back without seconds/moves/won instead of erroring.
    const { data } = await getServiceSupabase()
      .from("game_mode_results")
      .select("*")
      .eq("session_id", session)
      .returns<Record<string, unknown>[]>();

    const stats: Record<string, ModeAgg> = {};
    const rows: ModeRow[] = [];
    for (const raw of data ?? []) {
      const mode = typeof raw.mode === "string" ? raw.mode : "";
      const score = typeof raw.score === "number" ? raw.score : 0;
      if (!mode) continue;
      const s = (stats[mode] ??= { played: 0, best: 0, total: 0 });
      s.played += 1;
      s.best = Math.max(s.best, score);
      s.total += score;
      rows.push({
        mode,
        play_date: typeof raw.play_date === "string" ? raw.play_date : "",
        score,
        seconds: typeof raw.seconds === "number" ? raw.seconds : null,
        moves: typeof raw.moves === "number" ? raw.moves : null,
        won: typeof raw.won === "boolean" ? raw.won : null,
      });
    }
    return NextResponse.json({ stats, rows, configured: true });
  } catch {
    return NextResponse.json({ stats: {}, rows: [], configured: true });
  }
}
