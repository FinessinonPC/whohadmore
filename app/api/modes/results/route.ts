import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

// GET /api/modes/results?session=<id> - quick-game points per date, broken out
// by mode, so the archive can show either a per-game score or the combined total
// (even for days played on another device). Shape: { [date]: { [mode]: score } }.
// Best-effort: an unmigrated game_mode_results table just returns empty, and the
// archive falls back to on-device scores.
export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get("session");
  if (!session) return NextResponse.json({ results: {} }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ results: {} });

  try {
    const { data } = await getServiceSupabase()
      .from("game_mode_results")
      .select("play_date, mode, score")
      .eq("session_id", session)
      .returns<{ play_date: string; mode: string; score: number | null }[]>();

    const results: Record<string, Record<string, number>> = {};
    for (const row of data ?? []) {
      (results[row.play_date] ??= {})[row.mode] = row.score ?? 0;
    }
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: {} });
  }
}
