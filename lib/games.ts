// ============================================================================
// Server-side game data access. Used by the server-rendered play pages and the
// /api/game route so first paint is instant (no client fetch waterfall).
// ============================================================================

import { cache } from "react";
import { getServerSupabase } from "@/lib/supabase";
import { getWikimediaThumbnail } from "@/lib/wikimedia";
import { buildMockGame, isSupabaseConfigured } from "@/lib/mockGame";
import { todayISO } from "@/lib/date";
import type { DailyGame, FullGame, GameCard } from "@/types";

type GameMeta = Pick<
  DailyGame,
  "topic_label" | "stat_label" | "topic_category" | "stat_unit" | "description"
>;

/** Lightweight meta for a published game (no cards) - used for SEO titles. */
export async function getGameMeta(date: string): Promise<GameMeta | null> {
  if (!isSupabaseConfigured()) {
    const m = buildMockGame(date);
    return {
      topic_label: m.topic_label,
      stat_label: m.stat_label,
      topic_category: m.topic_category,
      stat_unit: m.stat_unit,
      description: m.description ?? null,
    };
  }
  // select("*") stays resilient if the optional `description` column isn't added yet.
  const { data } = await getServerSupabase()
    .from("daily_games")
    .select("*")
    .eq("play_date", date)
    .eq("published", true)
    .maybeSingle<GameMeta>();
  return data ?? null;
}

/** The published game for a date (with its ordered cards), or null.
 *  Cached per-request so generateMetadata and the page share a single fetch. */
export const getFullGame = cache(async (date: string): Promise<FullGame | null> => {
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
});

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

/** A handful of recent published puzzles (date + topic) for internal SEO links
 *  that cross-connect every game page and help Google crawl the whole archive. */
export async function getRecentGameLinks(
  excludeDate: string,
  limit = 6
): Promise<{ play_date: string; topic_label: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getServerSupabase()
    .from("daily_games")
    .select("play_date, topic_label")
    .eq("published", true)
    .lte("play_date", todayISO())
    .neq("play_date", excludeDate)
    .order("play_date", { ascending: false })
    .limit(limit)
    .returns<{ play_date: string; topic_label: string }[]>();
  return data ?? [];
}
