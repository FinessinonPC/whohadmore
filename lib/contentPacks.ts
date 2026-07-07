// ============================================================================
// Bundled daily content for the pack games (Duality, Word, Quads, Emoji). A
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

// --- Quads: sixteen words, four hidden groups of four ------------------------

export interface QuadsGroup {
  name: string;
  words: string[]; // exactly 4
}

export interface QuadsDay {
  groups: QuadsGroup[]; // exactly 4, ordered easy -> tricky
}

export const QUADS_PACK: QuadsDay[] = [
  {
    groups: [
      { name: "Coffee orders", words: ["LATTE", "MOCHA", "ESPRESSO", "CAPPUCCINO"] },
      { name: "Italian cities", words: ["ROME", "MILAN", "NAPLES", "TURIN"] },
      { name: "Pasta shapes", words: ["PENNE", "FUSILLI", "RIGATONI", "ORZO"] },
      { name: "Fashion houses", words: ["PRADA", "GUCCI", "ARMANI", "VERSACE"] },
    ],
  },
  {
    groups: [
      { name: "Things with keys", words: ["PIANO", "KEYBOARD", "MAP", "LOCK"] },
      { name: "Board games", words: ["RISK", "CLUE", "SORRY", "TROUBLE"] },
      { name: "Inside Out emotions", words: ["JOY", "FEAR", "ANGER", "DISGUST"] },
      { name: "___WORD", words: ["CROSS", "PASS", "SWEAR", "BUZZ"] },
    ],
  },
  {
    groups: [
      { name: "NBA teams", words: ["HEAT", "MAGIC", "THUNDER", "SPURS"] },
      { name: "Wet weather", words: ["FOG", "HAIL", "SLEET", "DRIZZLE"] },
      { name: "Music genres", words: ["FUNK", "SOUL", "BLUES", "HOUSE"] },
      { name: "Ballroom dances", words: ["SALSA", "SWING", "TANGO", "WALTZ"] },
    ],
  },
];

// --- Emoji: decode the pictures ----------------------------------------------

export interface EmojiRound {
  emoji: string;
  options: string[]; // 4 choices
  answer: number; // index into options
}

export interface EmojiDay {
  theme: string;
  rounds: EmojiRound[]; // 5
}

export const EMOJI_PACK: EmojiDay[] = [
  {
    theme: "Movies",
    rounds: [
      { emoji: "🦁👑", options: ["Madagascar", "The Lion King", "Zootopia", "The Jungle Book"], answer: 1 },
      { emoji: "🚢🧊💔", options: ["Titanic", "Life of Pi", "Jaws", "The Perfect Storm"], answer: 0 },
      { emoji: "🕷️🧑🗽", options: ["Ant-Man", "Venom", "Spider-Man", "Kick-Ass"], answer: 2 },
      { emoji: "🦖🏝️🧬", options: ["King Kong", "Godzilla", "The Lost World", "Jurassic Park"], answer: 3 },
      { emoji: "👽📞🚲", options: ["E.T.", "Alien", "Arrival", "Men in Black"], answer: 0 },
    ],
  },
  {
    theme: "Movies II",
    rounds: [
      { emoji: "🧙💍🌋", options: ["Harry Potter", "The Lord of the Rings", "Willow", "Eragon"], answer: 1 },
      { emoji: "🐠🔍🌊", options: ["Moana", "The Little Mermaid", "Finding Nemo", "Shark Tale"], answer: 2 },
      { emoji: "🎈🏠👴", options: ["Up", "Home Alone", "Monster House", "The House"], answer: 0 },
      { emoji: "❄️👭👑", options: ["Ice Age", "Snow White", "Elsa & Anna", "Frozen"], answer: 3 },
      { emoji: "🦇🃏🌆", options: ["Batman Begins", "The Dark Knight", "Joker", "Gotham"], answer: 1 },
    ],
  },
  {
    theme: "TV shows",
    rounds: [
      { emoji: "🐉👑⚔️", options: ["Vikings", "The Witcher", "Game of Thrones", "Merlin"], answer: 2 },
      { emoji: "🧪👨‍🏫💵", options: ["Breaking Bad", "Dexter", "Ozark", "Better Call Saul"], answer: 0 },
      { emoji: "📎🏢📷", options: ["Parks and Recreation", "30 Rock", "Suits", "The Office"], answer: 3 },
      { emoji: "🦑🎮🔴", options: ["Squid Game", "Alice in Borderland", "The Circle", "Black Mirror"], answer: 0 },
      { emoji: "👑👸🇬🇧", options: ["Downton Abbey", "The Crown", "Bridgerton", "Victoria"], answer: 1 },
    ],
  },
  {
    theme: "Say the phrase",
    rounds: [
      { emoji: "🌧️🐱🐶", options: ["Raining cats and dogs", "Wet dog smell", "Pet the rain", "Storm chasers"], answer: 0 },
      { emoji: "🍰🍴", options: ["Sweet tooth", "Piece of cake", "Have your cake", "Cake walk"], answer: 1 },
      { emoji: "🐘🚪🛋️", options: ["Elephant memory", "White elephant", "The elephant in the room", "Elephant walk"], answer: 2 },
      { emoji: "🐦🐦🪨", options: ["Bird brain", "Early bird", "Free as a bird", "Two birds, one stone"], answer: 3 },
      { emoji: "🧊💔", options: ["Ice cold heart", "Break the ice", "Cold shoulder", "Frozen stiff"], answer: 1 },
    ],
  },
  {
    theme: "Songs",
    rounds: [
      { emoji: "💃🌧️", options: ["Umbrella", "Dancing in the Rain", "Singin' in the Rain", "Purple Rain"], answer: 2 },
      { emoji: "🚀🧑‍🚀🎸", options: ["Rocket Man", "Space Oddity", "Starman", "Man on the Moon"], answer: 0 },
      { emoji: "👑👸💛", options: ["Royals", "Queen Bee", "Crown of Gold", "Kings & Queens"], answer: 0 },
      { emoji: "🌉🔥", options: ["London Bridge", "Burning Down the House", "We Didn't Start the Fire", "Burning Bridges"], answer: 3 },
      { emoji: "🖤💀🎹", options: ["Paint It Black", "Back in Black", "Black Keys", "Bohemian Rhapsody"], answer: 0 },
    ],
  },
];

// --- Selection ---------------------------------------------------------------

/** Deterministic pick: same day -> same content for every player. */
export function getDualityDaily(date: string): DualityDay {
  return DUALITY_PACK[hashSeed(`duality:${date}`) % DUALITY_PACK.length];
}

export function getWordDaily(date: string): string {
  return WORD_ANSWERS[hashSeed(`word:${date}`) % WORD_ANSWERS.length];
}

export function getQuadsDaily(date: string): QuadsDay {
  return QUADS_PACK[hashSeed(`quads:${date}`) % QUADS_PACK.length];
}

export function getEmojiDaily(date: string): EmojiDay {
  return EMOJI_PACK[hashSeed(`emoji:${date}`) % EMOJI_PACK.length];
}
