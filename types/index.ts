// ============================================================================
// WhoHadMore - shared types
// ============================================================================

export type TopicCategory =
  | "sports"
  | "geography"
  | "entertainment"
  | "science"
  | "current_events";

export const TOPIC_CATEGORIES: TopicCategory[] = [
  "sports",
  "geography",
  "entertainment",
  "science",
  "current_events",
];

export type ImageSource = "wikimedia" | "manual";

// --- Database row shapes -----------------------------------------------------

export interface DailyGame {
  id: string;
  play_date: string; // ISO date "YYYY-MM-DD"
  topic_label: string;
  topic_category: TopicCategory | null;
  stat_label: string;
  stat_unit: string | null;
  description?: string | null; // SEO blurb (optional; falls back to generated)
  published: boolean;
  created_at: string;
}

export interface GameCard {
  id: string;
  game_id: string;
  position: number; // 0–14, order in the chain
  entity_name: string;
  stat_value: number;
  image_url: string | null;
  image_source: ImageSource | null;
  created_at: string;
}

export interface GameResult {
  id: string;
  play_date: string;
  session_id: string; // anonymous for now; user_id later
  score: number | null;
  lives_remaining: number | null;
  completed: boolean | null;
  time_seconds: number | null;
  created_at: string;
}

// Scaffold-only (auth + leaderboards land later)
export interface AppUser {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  play_date: string;
  user_id: string | null;
  score: number | null;
  lives_remaining: number | null;
  time_seconds: number | null;
  rank: number | null;
  created_at: string;
}

// --- Composite / API shapes --------------------------------------------------

/** A daily game with its ordered card chain - what the play screen consumes. */
export interface FullGame extends DailyGame {
  cards: GameCard[];
}

/** Payload the admin editor sends to /api/admin/save-game. */
export interface SaveGamePayload {
  play_date: string;
  topic_label: string;
  topic_category: TopicCategory | null;
  stat_label: string;
  stat_unit: string | null;
  description?: string | null;
  published: boolean;
  cards: SaveCardInput[];
}

export interface SaveCardInput {
  position: number;
  entity_name: string;
  stat_value: number;
  image_url: string | null;
  image_source: ImageSource | null;
}

/** Shape the AI generator prompt asks the model to return. */
export interface AiGameJson {
  topic_label: string;
  topic_category: TopicCategory;
  stat_label: string;
  stat_unit: string;
  description?: string;
  cards: { entity_name: string; stat_value: number }[];
}
