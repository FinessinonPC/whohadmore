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
  /** The game's brand color - the trick letter in the wordmark, small chips. */
  accent: string;
  /** Ink that passes contrast ON TOP of `accent` (dark for light accents). */
  contrast: string;
  /** The game's pastel card stock - the squishy face of its hub card and
   *  in-game pieces. Same lightness across the set so they read as one deck. */
  pastel: string;
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

/** Every pair you find banks at least this much, no matter how many mistakes -
 *  finding 1 pair should never score 0. */
const DUALITY_PAIR_FLOOR = 100;

/** Duality score (0–1000): pairs found + a speed bonus on a solve, minus a
 *  penalty per wrong lock-in - but each found pair keeps a guaranteed floor,
 *  so partial progress always pays something. Only a fast, clean solve = 1000. */
export function dualityScore(found: number, mistakes: number, timeSeconds = 0): number {
  const base = found * DUALITY_PAIR_POINTS;
  const solved = found >= DUALITY_PAIRS;
  const speed = solved
    ? Math.round(DUALITY_SPEED_BONUS * timeFactor(timeSeconds, DUALITY_FAST_SECONDS, DUALITY_SLOW_SECONDS))
    : 0;
  const net = base - mistakes * DUALITY_MISTAKE_PENALTY + speed;
  return Math.min(DUALITY_MAX_SCORE, Math.max(found * DUALITY_PAIR_FLOOR, net, 0));
}

export const WORD_MAX_GUESSES = 6;
/** Points by number of guesses used (index 0 = solved in 1). */
export const WORD_POINTS = [1000, 900, 800, 700, 600, 500];
/** A lost Word still pays for knowledge earned: per letter locked green. */
export const WORD_GREEN_POINTS = 40; // max 5 x 40 = 200, always below the worst win

/** Partial credit on a lost Word: points per position the player proved green
 *  across all guesses. Losing with 4 letters placed beats losing blind. */
export function wordLossScore(rows: string[], answer: string): number {
  let greens = 0;
  for (let c = 0; c < answer.length; c++) {
    if (rows.some((r) => r[c] === answer[c])) greens += 1;
  }
  return greens * WORD_GREEN_POINTS;
}

/** Mini crossword (0–1000): a solve base + a speed bonus, minus a penalty per
 *  Check. Full speed bonus for a solve within par (45s), tapering off after
 *  that. Revealing pays partial credit for the letters you had right (max 250,
 *  always below a real solve). e.g. clean solve ≤45s = 1000; very slow = 800. */
export const MINI_MAX_POINTS = 1000;
export const MINI_CHECK_PENALTY = 100;
export const MINI_MIN_SCORE = 300; // floor for a solve
export const MINI_REVEAL_CREDIT = 250; // scaled by share of correct letters at reveal
const MINI_SOLVE_BASE = 800;
const MINI_SPEED_BONUS = 200;
const MINI_PAR_SECONDS = 45;

export function miniScore(checks: number, timeSeconds = 0): number {
  const factor =
    !Number.isFinite(timeSeconds) || timeSeconds <= 0
      ? 1
      : Math.min(1, MINI_PAR_SECONDS / timeSeconds);
  const speed = Math.round(MINI_SPEED_BONUS * factor);
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
    pastel: "#BCE8C6", // soft mint
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
    pastel: "#BBDFF2", // soft sky
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
    pastel: "#F8E6A2", // soft butter
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
    pastel: "#CBD1F6", // soft periwinkle
    maxPoints: MINI_MAX_POINTS,
    status: "live",
    href: (date) => `/mini/${date}`,
  },
];

export const LIVE_MODES = MODES.filter((m) => m.status === "live");

export function modeDef(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id) as ModeDef;
}
