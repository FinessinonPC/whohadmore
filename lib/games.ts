// ============================================================================
// Server-side game data access. Used by the server-rendered play pages and the
// /api/game route so first paint is instant (no client fetch waterfall).
// ============================================================================

import { getServerSupabase } from "@/lib/supabase";
import { getWikimediaThumbnail } from "@/lib/wikimedia";
import { buildMockGame, isSupabaseConfigured } from "@/lib/mockGame";
import type { DailyGame, FullGame, GameCard } from "@/types";

/** The published game for a date (with its ordered cards), or null. */
export async function getFullGame(date: string): Promise<FullGame | null> {
  // Fresh-clone fallback: serve a playable mock enriched with live images.
  if (!isSupabaseConfigured()) {
    const mock = buildMockGame(date);
    const cards = await Promise.all(
      mock.cards.map(async (c) => ({
        ...c,
        image_url: await getWikimediaThumbnail(c.entity_name),
      }))
    );
    return { ...mock, cards };
  }

  const supabase = getServerSupabase();
  const { data: game } = await supabase
    .from("daily_games")
    .select("*")
    .eq("play_date", date)
    .eq("published", true)
    .maybeSingle<DailyGame>();

  if (!game) return null;

  const { data: cards } = await supabase
    .from("game_cards")
    .select("*")
    .eq("game_id", game.id)
    .order("position", { ascending: true })
    .returns<GameCard[]>();

  return { ...game, cards: cards ?? [] };
}

/**
 * Game number = the Nth published game in chronological order. The first game
 * ever published is #1, regardless of calendar gaps.
 */
export async function getGameNumber(date: string): Promise<number> {
  if (!isSupabaseConfigured()) return 1;

  const supabase = getServerSupabase();
  const { count } = await supabase
    .from("daily_games")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .lte("play_date", date);

  return count ?? 0;
}

/** All published games up to today, oldest first, each tagged with its number. */
export async function getPublishedGamesWithNumbers(
  today: string
): Promise<(DailyGame & { game_number: number })[]> {
  if (!isSupabaseConfigured()) {
    const { cards: _cards, ...game } = buildMockGame(today);
    return [{ ...game, game_number: 1 }];
  }

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("daily_games")
    .select("*")
    .eq("published", true)
    .lte("play_date", today)
    .order("play_date", { ascending: true })
    .returns<DailyGame[]>();

  return (data ?? []).map((g, i) => ({ ...g, game_number: i + 1 }));
}
