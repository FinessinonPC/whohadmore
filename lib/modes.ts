// ============================================================================
// Game modes - the daily roster. Chain runs on the daily card set; the other
// games run on bundled daily content packs (lib/contentPacks.ts), so none of
// them add daily admin work.
// ============================================================================

export type ModeId = "chain" | "duality" | "word" | "quads" | "emoji";

export interface ModeDef {
  id: ModeId;
  /** Short product name (one word - the holistic naming scheme). */
  name: string;
  tagline: string;
  /** The game's brand color - used as the solid card background on the hub. */
  accent: string;
  /** Ink that passes contrast ON TOP of `accent` (dark for light accents). */
  contrast: string;
  maxPoints: number;
  status: "live" | "soon";
  href: (date: string) => string;
}

export const DUALITY_ITEMS = 8;
export const DUALITY_POINTS_PER_ITEM = 125;

export const WORD_MAX_GUESSES = 6;
/** Points by number of guesses used (index 0 = solved in 1). Fail = 0. */
export const WORD_POINTS = [1000, 900, 800, 700, 600, 500];

export const QUADS_GROUPS = 4;
export const QUADS_POINTS_PER_GROUP = 250;
export const QUADS_MAX_MISTAKES = 4;

export const EMOJI_ROUNDS = 5;
export const EMOJI_POINTS_PER_ROUND = 200;

/** The daily roster - familiar formats, one bold color block each. */
export const MODES: ModeDef[] = [
  {
    id: "chain",
    name: "Chain",
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
    tagline: "Two worlds, eight things. Sort every one to its side.",
    accent: "#06B6D4",
    contrast: "#0B0D10",
    maxPoints: DUALITY_ITEMS * DUALITY_POINTS_PER_ITEM,
    status: "live",
    href: (date) => `/duality/${date}`,
  },
  {
    id: "word",
    name: "Word",
    tagline: "Six tries to find the five letters. You know this one.",
    accent: "#FFC400",
    contrast: "#0B0D10",
    maxPoints: WORD_POINTS[0],
    status: "live",
    href: (date) => `/word/${date}`,
  },
  {
    id: "quads",
    name: "Quads",
    tagline: "Sixteen words hide four groups of four. Find them.",
    accent: "#A44BFF",
    contrast: "#FFFFFF",
    maxPoints: QUADS_GROUPS * QUADS_POINTS_PER_GROUP,
    status: "live",
    href: (date) => `/quads/${date}`,
  },
  {
    id: "emoji",
    name: "Emoji",
    tagline: "Five pictures-only puzzles. Decode what they're saying.",
    accent: "#FF7A00",
    contrast: "#0B0D10",
    maxPoints: EMOJI_ROUNDS * EMOJI_POINTS_PER_ROUND,
    status: "live",
    href: (date) => `/emoji/${date}`,
  },
];

export const LIVE_MODES = MODES.filter((m) => m.status === "live");

export function modeDef(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id) as ModeDef;
}
