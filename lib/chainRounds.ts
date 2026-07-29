import type { SupabaseClient } from "@supabase/supabase-js";

/** Chains have run 10 rounds for a long time; older days that never stored
 *  their count and whose cards can't be found fall back to this. */
export const DEFAULT_ROUNDS = 10;

/**
 * How many rounds each published day's Chain had: that day's cards minus one.
 *
 * Chain is scored as the share you got right, so the round count is part of the
 * score - and a result row only carries its own count from migration 0009 on.
 * Every path that scores a Chain from history needs the same answer for the
 * same day, or the profile, the boards and the backfill drift apart. This is
 * that answer, in one place.
 */
export async function roundsByDate(supabase: SupabaseClient): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const [{ data: games }, { data: cards }] = await Promise.all([
      supabase.from("daily_games").select("id, play_date"),
      supabase.from("game_cards").select("game_id"),
    ]);
    if (!games?.length) return out;

    const countByGame = new Map<string, number>();
    for (const c of (cards ?? []) as { game_id: string }[]) {
      countByGame.set(c.game_id, (countByGame.get(c.game_id) ?? 0) + 1);
    }
    for (const g of games as { id: string; play_date: string }[]) {
      const n = countByGame.get(g.id) ?? 0;
      if (n >= 2) out.set(g.play_date, n - 1);
    }
  } catch {
    /* fall back to the default rather than fail the caller */
  }
  return out;
}

/** Rounds for one row: its own stored count, else that day's cards, else 10. */
export function roundsFor(
  row: { play_date: string; rounds?: number | null },
  byDate: Map<string, number>
): number {
  if (typeof row.rounds === "number" && row.rounds > 0) return row.rounds;
  return byDate.get(row.play_date) ?? DEFAULT_ROUNDS;
}
