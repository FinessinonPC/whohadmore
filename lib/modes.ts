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

// A speed component so timed games vary meaningfully. 1.0 only for a genuinely
// fast solve (<= fastSeconds), decaying linearly to 0 at slowSeconds - so there
// is no "free zone" where any comfortable time still maxes the bonus. No timer
// (0) => full credit.
export function timeFactor(timeSeconds: number, fastSeconds: number, slowSeconds: number): number {
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return 1;
  if (timeSeconds <= fastSeconds) return 1;
  if (timeSeconds >= slowSeconds) return 0;
  return (slowSeconds - timeSeconds) / (slowSeconds - fastSeconds);
}

export const DUALITY_PAIRS = 4;
/** Three tries: three wrong lock-ins ends the game. */
export const DUALITY_MAX_MISTAKES = 3;
export const DUALITY_MAX_SCORE = 1000;
const DUALITY_PAIR_POINTS = 175; // 4 pairs = 700 base, leaving room for speed
const DUALITY_SPEED_BONUS = 300; // up to, awarded only on a full solve
const DUALITY_MISTAKE_PENALTY = 150; // per wrong lock-in
const DUALITY_FAST_SECONDS = 8; // <= this => full speed bonus
const DUALITY_SLOW_SECONDS = 60; // >= this => no speed bonus

/** Duality score (0–1000): pairs found + a speed bonus on a solve, minus a
 *  penalty per wrong lock-in. Only a fast, clean solve reaches 1000. */
export function dualityScore(found: number, mistakes: number, timeSeconds = 0): number {
  const base = found * DUALITY_PAIR_POINTS;
  const solved = found >= DUALITY_PAIRS;
  const speed = solved
    ? Math.round(DUALITY_SPEED_BONUS * timeFactor(timeSeconds, DUALITY_FAST_SECONDS, DUALITY_SLOW_SECONDS))
    : 0;
  return Math.max(0, Math.min(DUALITY_MAX_SCORE, base - mistakes * DUALITY_MISTAKE_PENALTY + speed));
}

export const WORD_MAX_GUESSES = 6;
/** Points by number of guesses used (index 0 = solved in 1). Fail = 0. */
export const WORD_POINTS = [1000, 900, 800, 700, 600, 500];

/** Mini crossword (0–1000): time is the main driver. A solve base + a big speed
 *  bonus (only a fast solve reaches 1000), minus a penalty per Check. Reveal = 0.
 *  e.g. a clean 40s solve ≈ 800; a clean 70s solve ≈ 600. */
export const MINI_MAX_POINTS = 1000;
export const MINI_CHECK_PENALTY = 100;
export const MINI_MIN_SCORE = 300; // floor for a solve
const MINI_SOLVE_BASE = 400;
const MINI_SPEED_BONUS = 600;
const MINI_FAST_SECONDS = 10; // <= this => full speed bonus
const MINI_SLOW_SECONDS = 100; // >= this => no speed bonus

export function miniScore(checks: number, timeSeconds = 0): number {
  const speed = Math.round(MINI_SPEED_BONUS * timeFactor(timeSeconds, MINI_FAST_SECONDS, MINI_SLOW_SECONDS));
  return Math.max(
    MINI_MIN_SCORE,
    Math.min(MINI_MAX_POINTS, MINI_SOLVE_BASE - checks * MINI_CHECK_PENALTY + speed)
  );
}

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
    maxPoints: DUALITY_MAX_SCORE,
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
