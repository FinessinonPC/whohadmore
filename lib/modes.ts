// ============================================================================
// Game modes - the daily roster. Chain runs on the daily card set; the other
// games run on bundled daily content packs (lib/contentPacks.ts), so none of
// them add daily admin work.
// ============================================================================

export type ModeId = "chain" | "duality" | "word" | "mini";

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

export const DUALITY_PAIRS = 4;
export const DUALITY_POINTS_PER_PAIR = 250;
export const DUALITY_MAX_MISTAKES = 4;

export const WORD_MAX_GUESSES = 6;
/** Points by number of guesses used (index 0 = solved in 1). Fail = 0. */
export const WORD_POINTS = [1000, 900, 800, 700, 600, 500];

/** Mini crossword: start at 1000, each failed check costs 100, floor 400.
 *  Revealing the solution scores 0. */
export const MINI_MAX_POINTS = 1000;
export const MINI_CHECK_PENALTY = 100;
export const MINI_MIN_SCORE = 400;

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
    tagline: "Eight definitions, four hidden pairs. Two meanings, one word.",
    accent: "#06B6D4",
    contrast: "#0B0D10",
    maxPoints: DUALITY_PAIRS * DUALITY_POINTS_PER_PAIR,
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
    id: "mini",
    name: "Mini",
    tagline: "A bite-size crossword. Five by five, no mercy.",
    accent: "#2E6BFF",
    contrast: "#FFFFFF",
    maxPoints: MINI_MAX_POINTS,
    status: "live",
    href: (date) => `/mini/${date}`,
  },
];

export const LIVE_MODES = MODES.filter((m) => m.status === "live");

export function modeDef(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id) as ModeDef;
}
