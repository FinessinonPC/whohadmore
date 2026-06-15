import type { FullGame, GameCard } from "@/types";

// ============================================================================
// Mock game — used as a graceful fallback when Supabase isn't configured yet,
// so `npm run dev` is instantly playable on a fresh clone. Real games come
// from the database. Entity names match Wikipedia titles so images auto-fill.
// ============================================================================

const NBA_2024_25: { name: string; ppg: number }[] = [
  { name: "Luka Dončić", ppg: 28.1 },
  { name: "Shai Gilgeous-Alexander", ppg: 32.7 },
  { name: "LeBron James", ppg: 24.4 },
  { name: "Anthony Edwards", ppg: 27.6 },
  { name: "Nikola Jokić", ppg: 29.6 },
  { name: "Stephen Curry", ppg: 24.5 },
  { name: "Giannis Antetokounmpo", ppg: 30.4 },
  { name: "Tyrese Maxey", ppg: 26.3 },
  { name: "Kevin Durant", ppg: 26.6 },
  { name: "Jayson Tatum", ppg: 26.8 },
  { name: "Devin Booker", ppg: 25.6 },
  { name: "Damian Lillard", ppg: 24.9 },
  { name: "De'Aaron Fox", ppg: 25.0 },
  { name: "Donovan Mitchell", ppg: 24.0 },
  { name: "Trae Young", ppg: 24.2 },
];

export function buildMockGame(playDate: string): FullGame {
  const cards: GameCard[] = NBA_2024_25.map((p, i) => ({
    id: `mock-card-${i}`,
    game_id: "mock-game",
    position: i,
    entity_name: p.name,
    stat_value: p.ppg,
    image_url: null,
    image_source: "wikimedia",
    created_at: new Date().toISOString(),
  }));

  return {
    id: "mock-game",
    play_date: playDate,
    topic_label: "NBA Scoring Leaders 2024-25",
    topic_category: "sports",
    stat_label: "Points Per Game",
    stat_unit: "PPG",
    published: true,
    created_at: new Date().toISOString(),
    cards,
  };
}

/** True when Supabase credentials are present in the environment. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
