// ============================================================================
// Game modes. Every mode is derived from the SAME daily card set, so one
// published game per day powers the whole hub - no extra admin work.
// ============================================================================

import { hashSeed, mulberry32, seededShuffle } from "@/lib/seed";
import type { GameCard } from "@/types";

export type ModeId =
  | "chain"
  | "duality"
  | "rank"
  | "impostor"
  | "pinpoint"
  | "recall"
  | "split";

export interface ModeDef {
  id: ModeId;
  /** Short product name (one word - the holistic naming scheme). */
  name: string;
  /** The verb that makes this game different from the others. */
  verb: string;
  tagline: string;
  /** The game's brand color - used as the solid card background on the hub. */
  accent: string;
  /** Ink that passes contrast ON TOP of `accent` (dark for light accents). */
  contrast: string;
  maxPoints: number;
  status: "live" | "soon";
  href: (date: string) => string;
}

export const RANK_SLOTS = 5;
export const PINPOINT_ROUNDS = 4;
export const RECALL_CARDS = 4;
export const SPLIT_ROUNDS = 5;
export const DUALITY_ITEMS = 8;
export const IMPOSTOR_ROUNDS = 5;
export const RANK_POINTS_PER_SLOT = 200;
export const PINPOINT_POINTS_PER_ROUND = 250;
export const RECALL_POINTS_PER_MATCH = 250;
export const SPLIT_POINTS_PER_ROUND = 200;
export const DUALITY_POINTS_PER_ITEM = 125;
export const IMPOSTOR_POINTS_PER_ROUND = 200;

/** The daily roster. One topic powers every game; each game is a different
 *  verb so the hub feels like a collection, not five flavors of one idea. */
export const MODES: ModeDef[] = [
  {
    id: "chain",
    name: "Chain",
    verb: "Compare",
    tagline: "The classic higher-or-lower run. How far can you go?",
    accent: "#00C853",
    contrast: "#0B0D10",
    maxPoints: 0, // open-ended (XP formula); shown as its own score
    status: "live",
    href: (date) => `/play/${date}`,
  },
  {
    id: "duality",
    name: "Duality",
    verb: "Sort",
    tagline: "Two worlds, eight things. Sort every one to its side.",
    accent: "#06B6D4",
    contrast: "#0B0D10",
    maxPoints: DUALITY_ITEMS * DUALITY_POINTS_PER_ITEM,
    status: "live",
    href: (date) => `/duality/${date}`,
  },
  {
    id: "rank",
    name: "Rank",
    verb: "Order",
    tagline: "Five cards. Put them in order, top to bottom.",
    accent: "#2E6BFF",
    contrast: "#FFFFFF",
    maxPoints: RANK_SLOTS * RANK_POINTS_PER_SLOT,
    status: "live",
    href: (date) => `/rank/${date}`,
  },
  {
    id: "impostor",
    name: "Impostor",
    verb: "Spot",
    tagline: "Three belong together. One is lying. Find it.",
    accent: "#FF4D8D",
    contrast: "#FFFFFF",
    maxPoints: IMPOSTOR_ROUNDS * IMPOSTOR_POINTS_PER_ROUND,
    status: "live",
    href: (date) => `/impostor/${date}`,
  },
  {
    id: "pinpoint",
    name: "Pinpoint",
    verb: "Estimate",
    tagline: "Slide to the exact number. Closer scores more.",
    accent: "#FFB300",
    contrast: "#0B0D10",
    maxPoints: PINPOINT_ROUNDS * PINPOINT_POINTS_PER_ROUND,
    status: "live",
    href: (date) => `/pinpoint/${date}`,
  },
  {
    id: "recall",
    name: "Recall",
    verb: "Remember",
    tagline: "Study the board, then match every number from memory.",
    accent: "#A44BFF",
    contrast: "#FFFFFF",
    maxPoints: RECALL_CARDS * RECALL_POINTS_PER_MATCH,
    status: "soon",
    href: (date) => `/recall/${date}`,
  },
  {
    id: "split",
    name: "Split",
    verb: "Judge",
    tagline: "Over or under the line? Five snap calls.",
    accent: "#FF7A00",
    contrast: "#0B0D10",
    maxPoints: SPLIT_ROUNDS * SPLIT_POINTS_PER_ROUND,
    status: "soon",
    href: (date) => `/split/${date}`,
  },
];

export const LIVE_MODES = MODES.filter((m) => m.status === "live");

export function modeDef(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id) as ModeDef;
}

/** Distinct-value cards only (ties make ordering/guessing unfair). */
function distinctByValue(cards: GameCard[]): GameCard[] {
  const seen = new Set<number>();
  return cards.filter((c) => {
    if (seen.has(c.stat_value)) return false;
    seen.add(c.stat_value);
    return true;
  });
}

/** The five cards a given player ranks today - seeded per session+date so a
 *  reload never deals an easier hand, but every player gets their own mix. */
export function pickRankCards(cards: GameCard[], seedKey: string): GameCard[] {
  const pool = distinctByValue(cards);
  const rng = mulberry32(hashSeed(`${seedKey}:rank`));
  return seededShuffle(pool, rng).slice(0, Math.min(RANK_SLOTS, pool.length));
}

/** The cards a given player pinpoints today (same seeding idea). */
export function pickPinpointCards(cards: GameCard[], seedKey: string): GameCard[] {
  const pool = distinctByValue(cards);
  const rng = mulberry32(hashSeed(`${seedKey}:pinpoint`));
  return seededShuffle(pool, rng).slice(0, Math.min(PINPOINT_ROUNDS, pool.length));
}

/** Slider bounds for pinpoint: the day's full value range with a little air,
 *  so the day's other cards give you an honest sense of scale. */
export function pinpointRange(cards: GameCard[]): { min: number; max: number; step: number } {
  const values = cards.map((c) => c.stat_value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.1 || 1;
  const min = lo - pad;
  const max = hi + pad;
  const step = (max - min) / 200;
  return { min, max, step };
}

/** Pinpoint round score: linear accuracy over the range, curved to reward
 *  real precision (a mid-range shrug earns little). */
export function pinpointScore(guess: number, actual: number, min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 0;
  const accuracy = Math.max(0, 1 - Math.abs(guess - actual) / range);
  return Math.round(PINPOINT_POINTS_PER_ROUND * Math.pow(accuracy, 1.6));
}

/** Rank score: exact-position matches only, no partial credit. */
export function rankScore(order: GameCard[], correct: GameCard[]): number {
  let hits = 0;
  for (let i = 0; i < order.length; i++) if (order[i].id === correct[i].id) hits++;
  return hits * RANK_POINTS_PER_SLOT;
}

/** Compact stat formatting shared by the new modes (1.2M, 34.5K, 12.3). */
export function formatValue(value: number, unit: string | null): string {
  const abs = Math.abs(value);
  let num: string;
  if (abs >= 1_000_000_000) num = `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  else if (abs >= 1_000_000) num = `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  else if (abs >= 10_000) num = `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  else if (Number.isInteger(value)) num = value.toLocaleString("en-US");
  else num = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return unit ? `${num} ${unit}` : num;
}
