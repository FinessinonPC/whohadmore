import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

// GET /api/modes/results?session=<id> - combined quick-game points per date, so
// the archive can show one total across every game (not just Chain) even for
// days played on another device. Best-effort: an unmigrated game_mode_results
// table just returns empty, and the archive falls back to on-device scores.
export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get("session");
  if (!session) return NextResponse.json({ results: {} }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ results: {} });

  try {
    const { data } = await getServiceSupabase()
      .from("game_mode_results")
      .select("play_date, score")
      .eq("session_id", session)
      .returns<{ play_date: string; score: number | null }[]>();

    const results: Record<string, number> = {};
    for (const row of data ?? []) {
      results[row.play_date] = (results[row.play_date] ?? 0) + (row.score ?? 0);
    }
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: {} });
  }
}
