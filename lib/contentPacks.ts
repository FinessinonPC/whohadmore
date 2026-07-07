// ============================================================================
// Bundled daily content for the pack games (Duality, Word, Mini). A
// pack day is chosen deterministically from the date, so everyone plays the
// same round on the same day with ZERO daily admin work. Later, rows in a
// `daily_minigames` table can override the pack for a given date (see
// docs/BLUEPRINT.md) - the packs stay as the always-works fallback.
// ============================================================================

import { hashSeed } from "@/lib/seed";

// --- Duality: two categories, eight things - sort each to its side ----------

export interface DualityItem {
  text: string;
  side: "L" | "R";
  note?: string;
}

export interface DualityDay {
  left: string;
  right: string;
  items: DualityItem[]; // 8, mixed order as presented
}

export const DUALITY_PACK: DualityDay[] = [
  {
    left: "Tarantino",
    right: "Scorsese",
    items: [
      { text: "Pulp Fiction", side: "L" },
      { text: "Goodfellas", side: "R" },
      { text: "Kill Bill", side: "L" },
      { text: "The Departed", side: "R", note: "Won Scorsese his Best Director Oscar" },
      { text: "Casino", side: "R" },
      { text: "Reservoir Dogs", side: "L", note: "Tarantino's debut" },
      { text: "Django Unchained", side: "L" },
      { text: "Taxi Driver", side: "R" },
    ],
  },
  {
    left: "The Beatles",
    right: "Rolling Stones",
    items: [
      { text: "Hey Jude", side: "L" },
      { text: "Paint It Black", side: "R" },
      { text: "Eleanor Rigby", side: "L" },
      { text: "Gimme Shelter", side: "R" },
      { text: "Come Together", side: "L" },
      { text: "Angie", side: "R" },
      { text: "Let It Be", side: "L" },
      { text: "Sympathy for the Devil", side: "R" },
    ],
  },
  {
    left: "Country in Africa",
    right: "Country in Asia",
    items: [
      { text: "Mali", side: "L" },
      { text: "Laos", side: "R" },
      { text: "Ghana", side: "L" },
      { text: "Nepal", side: "R" },
      { text: "Oman", side: "R" },
      { text: "Chad", side: "L" },
      { text: "Bhutan", side: "R" },
      { text: "Benin", side: "L" },
    ],
  },
  {
    left: "NBA team",
    right: "NFL team",
    items: [
      { text: "Jazz", side: "L", note: "Utah Jazz" },
      { text: "Ravens", side: "R", note: "Baltimore" },
      { text: "Raptors", side: "L", note: "Toronto" },
      { text: "Titans", side: "R", note: "Tennessee" },
      { text: "Chargers", side: "R", note: "Los Angeles" },
      { text: "Bucks", side: "L", note: "Milwaukee" },
      { text: "Texans", side: "R", note: "Houston" },
      { text: "Pacers", side: "L", note: "Indiana" },
    ],
  },
  {
    left: "Pixar",
    right: "DreamWorks",
    items: [
      { text: "Coco", side: "L" },
      { text: "Shrek", side: "R" },
      { text: "Up", side: "L" },
      { text: "Kung Fu Panda", side: "R" },
      { text: "Madagascar", side: "R" },
      { text: "Ratatouille", side: "L" },
      { text: "How to Train Your Dragon", side: "R" },
      { text: "Brave", side: "L" },
    ],
  },
  {
    left: "Greek god",
    right: "Roman god",
    items: [
      { text: "Hermes", side: "L" },
      { text: "Mars", side: "R" },
      { text: "Athena", side: "L" },
      { text: "Venus", side: "R" },
      { text: "Juno", side: "R" },
      { text: "Poseidon", side: "L" },
      { text: "Mercury", side: "R", note: "The Roman Hermes" },
      { text: "Ares", side: "L", note: "The Greek Mars" },
    ],
  },
  {
    left: "Pasta shape",
    right: "Italian city",
    items: [
      { text: "Rigatoni", side: "L" },
      { text: "Modena", side: "R", note: "Home of balsamic vinegar" },
      { text: "Farfalle", side: "L", note: "The bow-tie one" },
      { text: "Perugia", side: "R" },
      { text: "Bergamo", side: "R" },
      { text: "Orecchiette", side: "L", note: "'Little ears'" },
      { text: "Ravenna", side: "R" },
      { text: "Gemelli", side: "L" },
    ],
  },
  {
    left: "Harry Potter spell",
    right: "IKEA product",
    items: [
      { text: "Alohomora", side: "L", note: "Unlocks doors" },
      { text: "MALM", side: "R", note: "The bed frame" },
      { text: "Expelliarmus", side: "L" },
      { text: "KALLAX", side: "R", note: "The shelf everyone owns" },
      { text: "POÄNG", side: "R", note: "The bouncy chair" },
      { text: "Lumos", side: "L" },
      { text: "BILLY", side: "R", note: "The bookcase" },
      { text: "Muffliato", side: "L" },
    ],
  },
  {
    left: "Chemical element",
    right: "Constellation",
    items: [
      { text: "Argon", side: "L" },
      { text: "Orion", side: "R" },
      { text: "Krypton", side: "L", note: "A real noble gas, not just Superman's home" },
      { text: "Lyra", side: "R" },
      { text: "Draco", side: "R" },
      { text: "Cobalt", side: "L" },
      { text: "Cygnus", side: "R", note: "The swan" },
      { text: "Radon", side: "L" },
    ],
  },
  {
    left: "Shakespeare play",
    right: "Jane Austen novel",
    items: [
      { text: "Othello", side: "L" },
      { text: "Emma", side: "R" },
      { text: "Macbeth", side: "L" },
      { text: "Persuasion", side: "R" },
      { text: "Mansfield Park", side: "R" },
      { text: "Twelfth Night", side: "L" },
      { text: "Northanger Abbey", side: "R" },
      { text: "The Tempest", side: "L" },
    ],
  },
];

// --- Word: one five-letter answer per day (the format you know) -------------

export const WORD_ANSWERS: string[] = [
  "CRANE", "SPORT", "MONEY", "HEART", "GLOBE", "PIZZA", "TIGER", "OCEAN",
  "MUSIC", "STORM", "BRAVE", "LIGHT", "DREAM", "TRACK", "FLAME", "CROWN",
  "PLANT", "SMILE", "RIVER", "CANDY", "SHARK", "PIANO", "GRAPE", "CLOUD",
  "STONE", "MAGIC", "TRAIN", "HONEY", "WHALE", "BREAD", "QUEEN", "LEMON",
  "SPACE", "BEACH", "NIGHT", "WATCH", "HOUSE", "SNAKE", "DANCE", "GHOST",
  "MOUNT", "TOAST", "FROST", "SOLAR", "ROBIN", "APPLE", "CHESS", "PEARL",
  "WORLD", "SCORE", "SOUND", "PAINT", "ARENA", "VOICE", "SUGAR", "EAGLE",
  "TRUTH", "OLIVE", "COACH", "MEDAL", "RANCH", "SPICE", "MAPLE", "TORCH",
  "BLAZE", "CORAL", "DERBY", "FIELD", "GIANT", "JUICE", "KNIFE", "LUNAR",
  "NOBLE", "ORBIT", "PRIZE", "QUIET", "ROAST", "SHINE", "TITAN", "VIVID",
];

// --- Selection ---------------------------------------------------------------

/** Deterministic pick: same day -> same content for every player. */
export function getDualityDaily(date: string): DualityDay {
  return DUALITY_PACK[hashSeed(`duality:${date}`) % DUALITY_PACK.length];
}

export function getWordDaily(date: string): string {
  return WORD_ANSWERS[hashSeed(`word:${date}`) % WORD_ANSWERS.length];
}

// --- Mini: a 5x5 crossword ----------------------------------------------------
// Grids are machine-verified (every across AND down entry is a real word from
// the fill dictionary; generated by backtracking, clues written by hand).
// '#' = black square. Numbering follows standard crossword rules.

export interface MiniClue {
  num: number;
  row: number;
  col: number;
  len: number;
  clue: string;
  answer: string;
}

export interface MiniDay {
  rows: string[]; // 5 strings of 5 chars, '#' for black
  across: MiniClue[];
  down: MiniClue[];
}

export const MINI_PACK: MiniDay[] = [
  {
    rows: ["SEA##", "ACRE#", "WHEAT", "#ONCE", "##AHA"],
    across: [
      { num: 1, row: 0, col: 0, len: 3, clue: "Where waves crash", answer: "SEA" },
      { num: 4, row: 1, col: 0, len: 4, clue: "Unit of farmland", answer: "ACRE" },
      { num: 6, row: 2, col: 0, len: 5, clue: "Grain in most bread", answer: "WHEAT" },
      { num: 8, row: 3, col: 1, len: 4, clue: "A single time", answer: "ONCE" },
      { num: 9, row: 4, col: 2, len: 3, clue: "Cry of discovery", answer: "AHA" },
    ],
    down: [
      { num: 1, row: 0, col: 0, len: 3, clue: "Carpenter's cutter", answer: "SAW" },
      { num: 2, row: 0, col: 1, len: 4, clue: "Canyon comeback", answer: "ECHO" },
      { num: 3, row: 0, col: 2, len: 5, clue: "Where the home team plays", answer: "ARENA" },
      { num: 5, row: 1, col: 3, len: 4, clue: "Apiece", answer: "EACH" },
      { num: 7, row: 2, col: 4, len: 3, clue: "Brit's afternoon brew", answer: "TEA" },
    ],
  },
  {
    rows: ["ART##", "SOAP#", "POLAR", "#TOGA", "##NET"],
    across: [
      { num: 1, row: 0, col: 0, len: 3, clue: "Gallery hangings", answer: "ART" },
      { num: 4, row: 1, col: 0, len: 4, clue: "Bathtub bar", answer: "SOAP" },
      { num: 6, row: 2, col: 0, len: 5, clue: "Like the Arctic, or a famous bear", answer: "POLAR" },
      { num: 8, row: 3, col: 1, len: 4, clue: "Ancient Roman wrap", answer: "TOGA" },
      { num: 9, row: 4, col: 2, len: 3, clue: "It hangs from a basketball rim", answer: "NET" },
    ],
    down: [
      { num: 1, row: 0, col: 0, len: 3, clue: "Cleopatra's snake", answer: "ASP" },
      { num: 2, row: 0, col: 1, len: 4, clue: "Cheer (for)", answer: "ROOT" },
      { num: 3, row: 0, col: 2, len: 5, clue: "Eagle's claw", answer: "TALON" },
      { num: 5, row: 1, col: 3, len: 4, clue: "One of about 300 in a novel", answer: "PAGE" },
      { num: 7, row: 2, col: 4, len: 3, clue: "Sewer scurrier", answer: "RAT" },
    ],
  },
  {
    rows: ["PET##", "OURS#", "PRIOR", "#OBOE", "##END"],
    across: [
      { num: 1, row: 0, col: 0, len: 3, clue: "Dog or cat, e.g.", answer: "PET" },
      { num: 4, row: 1, col: 0, len: 4, clue: "Belonging to us", answer: "OURS" },
      { num: 6, row: 2, col: 0, len: 5, clue: "Earlier in time", answer: "PRIOR" },
      { num: 8, row: 3, col: 1, len: 4, clue: "Reed in the orchestra", answer: "OBOE" },
      { num: 9, row: 4, col: 2, len: 3, clue: "Credits signal", answer: "END" },
    ],
    down: [
      { num: 1, row: 0, col: 0, len: 3, clue: "Soda, in the Midwest", answer: "POP" },
      { num: 2, row: 0, col: 1, len: 4, clue: "Currency in Paris", answer: "EURO" },
      { num: 3, row: 0, col: 2, len: 5, clue: "Close-knit group", answer: "TRIBE" },
      { num: 5, row: 1, col: 3, len: 4, clue: "Before long", answer: "SOON" },
      { num: 7, row: 2, col: 4, len: 3, clue: "Stop-sign shade", answer: "RED" },
    ],
  },
];

export function getMiniDaily(date: string): MiniDay {
  return MINI_PACK[hashSeed(`mini:${date}`) % MINI_PACK.length];
}
