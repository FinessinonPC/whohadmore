import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

// Per-mode score ceilings (see docs/BLUEPRINT.md §3 - every quick game caps
// around 1000 so no mode dominates the combined total).
const MODE_MAX: Record<string, number> = {
  duality: 1000,
  word: 1000,
  mini: 1000,
};

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
    };
    const { session_id, play_date, mode, score } = body;

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

    const { error } = await getServiceSupabase()
      .from("game_mode_results")
      .upsert(
        {
          play_date,
          session_id,
          mode,
          score: Math.round(score),
        },
        { onConflict: "play_date,session_id,mode", ignoreDuplicates: true }
      );
    if (error) {
      console.error("[modes] record failed (is game_mode_results created?):", error.message);
      return NextResponse.json({ ok: true, recorded: false });
    }
    return NextResponse.json({ ok: true, recorded: true });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
