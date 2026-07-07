// ============================================================================
// Bundled daily content for the non-stat games (Duality, Impostor). A pack day
// is chosen deterministically from the date, so everyone plays the same round
// on the same day with ZERO daily admin work. Later, rows in a
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

// --- Impostor: four things, three share a connection, one doesn't -----------

export interface ImpostorRound {
  options: string[]; // exactly 4
  impostor: number; // index into options
  connection: string; // what the other three share
}

export interface ImpostorDay {
  rounds: ImpostorRound[]; // 5
}

export const IMPOSTOR_PACK: ImpostorDay[] = [
  {
    rounds: [
      { options: ["Mercury", "Venus", "Titan", "Neptune"], impostor: 2, connection: "Planets - Titan is a moon of Saturn" },
      { options: ["Nile", "Amazon", "Sahara", "Danube"], impostor: 2, connection: "Rivers - the Sahara is a desert" },
      { options: ["Python", "Ruby", "Cobra", "Java"], impostor: 2, connection: "Programming languages" },
      { options: ["Leonardo", "Michelangelo", "Galileo", "Donatello"], impostor: 2, connection: "Teenage Mutant Ninja Turtles" },
      { options: ["Salmon", "Tuna", "Dolphin", "Trout"], impostor: 2, connection: "Fish - a dolphin is a mammal" },
    ],
  },
  {
    rounds: [
      { options: ["Everest", "K2", "Vesuvius", "Kilimanjaro"], impostor: 2, connection: "Famously tall peaks - Vesuvius is a short volcano" },
      { options: ["Picasso", "Monet", "Mozart", "Dalí"], impostor: 2, connection: "Painters - Mozart composed" },
      { options: ["Oxygen", "Nitrogen", "Quartz", "Helium"], impostor: 2, connection: "Chemical elements - quartz is a mineral" },
      { options: ["Google", "Amazon", "Nike", "Tesla"], impostor: 2, connection: "Tech companies" },
      { options: ["Madrid", "Rome", "Sydney", "Berlin"], impostor: 2, connection: "Capital cities - Australia's is Canberra" },
    ],
  },
  {
    rounds: [
      { options: ["Sushi", "Tempura", "Kimchi", "Ramen"], impostor: 2, connection: "Japanese dishes - kimchi is Korean" },
      { options: ["Violin", "Cello", "Trumpet", "Viola"], impostor: 2, connection: "String instruments" },
      { options: ["Zeus", "Apollo", "Mars", "Ares"], impostor: 2, connection: "Greek gods - Mars is Roman" },
      { options: ["Copper", "Iron", "Bronze", "Gold"], impostor: 2, connection: "Elements - bronze is an alloy" },
      { options: ["Chess", "Checkers", "Poker", "Go"], impostor: 2, connection: "Board games - poker is cards" },
    ],
  },
  {
    rounds: [
      { options: ["Eagle", "Owl", "Bat", "Falcon"], impostor: 2, connection: "Birds - a bat is a mammal" },
      { options: ["Diamond", "Ruby", "Pearl", "Emerald"], impostor: 2, connection: "Mineral gems - pearls come from oysters" },
      { options: ["Thames", "Seine", "Alps", "Tiber"], impostor: 2, connection: "European rivers - the Alps are mountains" },
      { options: ["Mercury", "Gold", "Steel", "Iron"], impostor: 2, connection: "Elements - steel is an alloy" },
      { options: ["Merlot", "Chardonnay", "Porter", "Riesling"], impostor: 2, connection: "Wines - a porter is a beer" },
    ],
  },
  {
    rounds: [
      { options: ["Portuguese", "Spanish", "German", "Italian"], impostor: 2, connection: "Romance languages" },
      { options: ["Saturn", "Jupiter", "Pluto", "Uranus"], impostor: 2, connection: "Planets - Pluto was demoted in 2006" },
      { options: ["Cappuccino", "Espresso", "Chai", "Latte"], impostor: 2, connection: "Coffee drinks - chai is tea" },
      { options: ["Femur", "Tibia", "Bicep", "Fibula"], impostor: 2, connection: "Bones - the bicep is a muscle" },
      { options: ["Monopoly", "Scrabble", "Uno", "Clue"], impostor: 2, connection: "Board games - Uno is a card game" },
    ],
  },
];

// --- Selection ---------------------------------------------------------------

/** Deterministic pick: same day → same content for every player. */
export function getDualityDaily(date: string): DualityDay {
  return DUALITY_PACK[hashSeed(`duality:${date}`) % DUALITY_PACK.length];
}

export function getImpostorDaily(date: string): ImpostorDay {
  return IMPOSTOR_PACK[hashSeed(`impostor:${date}`) % IMPOSTOR_PACK.length];
}
