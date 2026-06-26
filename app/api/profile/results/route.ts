import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { heartsFor } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

interface PlayedResult {
  reached: number;
  rounds: number;
  lives: number;
  timeSeconds: number;
  xpEarned: number;
}

// GET /api/profile/results?session_id=...  ->  { results: { [date]: PlayedResult } }
// Every game this session has completed, with rounds resolved from card counts
// so the archive can render tiers. After sign-in the session is the account's
// canonical id, so this reflects history across devices.
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ results: {} });
  }

  const session_id = new URL(req.url).searchParams.get("session_id");
  if (!session_id) {
    return NextResponse.json({ results: {} });
  }

  const supabase = getServiceSupabase();
  const { data: rows } = await supabase
    .from("game_results")
    .select("play_date, score, lives_remaining, time_seconds, points")
    .eq("session_id", session_id)
    .returns<
      {
        play_date: string;
        score: number | null;
        lives_remaining: number | null;
        time_seconds: number | null;
        points: number | null;
      }[]
    >();

  const list = rows ?? [];
  if (list.length === 0) {
    return NextResponse.json({ results: {} });
  }

  // Resolve rounds (= cards - 1) for each played date.
  const dates = Array.from(new Set(list.map((r) => r.play_date)));
  const { data: games } = await supabase
    .from("daily_games")
    .select("id, play_date")
    .in("play_date", dates)
    .returns<{ id: string; play_date: string }[]>();
  const dateByGame = new Map((games ?? []).map((g) => [g.id, g.play_date]));

  const roundsByDate = new Map<string, number>();
  const gameIds = (games ?? []).map((g) => g.id);
  if (gameIds.length) {
    const { data: cards } = await supabase
      .from("game_cards")
      .select("game_id")
      .in("game_id", gameIds)
      .returns<{ game_id: string }[]>();
    const countByGame = new Map<string, number>();
    (cards ?? []).forEach((c) => countByGame.set(c.game_id, (countByGame.get(c.game_id) ?? 0) + 1));
    countByGame.forEach((count, gameId) => {
      const d = dateByGame.get(gameId);
      if (d) roundsByDate.set(d, Math.max(0, count - 1));
    });
  }

  // One entry per date - keep the best run if duplicates ever exist.
  const results: Record<string, PlayedResult> = {};
  for (const r of list) {
    const reached = r.score ?? 0;
    const entry: PlayedResult = {
      reached,
      rounds: roundsByDate.get(r.play_date) ?? reached,
      lives: heartsFor(r.lives_remaining ?? 0),
      timeSeconds: r.time_seconds ?? 0,
      xpEarned: r.points ?? 0,
    };
    const prev = results[r.play_date];
    if (!prev || entry.reached > prev.reached) results[r.play_date] = entry;
  }

  return NextResponse.json({ results });
}
