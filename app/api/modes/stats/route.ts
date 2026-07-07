import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";

export const dynamic = "force-dynamic";

interface ModeAgg {
  played: number;
  best: number;
  total: number;
}

// GET /api/modes/stats?session=<id> - lifetime per-game aggregates for the
// quick games (Chain's lifetime stats live on the profile itself).
// Best-effort: an unmigrated game_mode_results table returns empty stats.
export async function GET(req: Request) {
  const session = new URL(req.url).searchParams.get("session");
  if (!session) return NextResponse.json({ error: "session required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ stats: {}, configured: false });

  try {
    const { data } = await getServiceSupabase()
      .from("game_mode_results")
      .select("mode, score")
      .eq("session_id", session)
      .returns<{ mode: string; score: number | null }[]>();

    const stats: Record<string, ModeAgg> = {};
    for (const row of data ?? []) {
      const s = (stats[row.mode] ??= { played: 0, best: 0, total: 0 });
      s.played += 1;
      s.best = Math.max(s.best, row.score ?? 0);
      s.total += row.score ?? 0;
    }
    return NextResponse.json({ stats, configured: true });
  } catch {
    return NextResponse.json({ stats: {}, configured: true });
  }
}
