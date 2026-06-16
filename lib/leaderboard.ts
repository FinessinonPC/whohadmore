// ============================================================================
// Leaderboard scoring, leveling, and achievements. Pure functions shared by the
// server routes (writing stats) and the UI (display).
// ============================================================================

export interface Profile {
  id: string;
  session_id: string;
  username: string | null;
  xp: number;
  total_stars: number;
  days_played: number;
  current_streak: number;
  longest_streak: number;
  last_played_date: string | null;
  monthly_score: number;
  monthly_period: string | null;
  achievements: string[];
  created_at: string;
  updated_at: string;
}

export interface LeaderboardRow {
  rank: number;
  username: string;
  monthly_score: number;
  total_stars: number;
  current_streak: number;
  level: number;
}

// --- Levels ------------------------------------------------------------------

export const XP_PER_LEVEL = 150;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}
export function xpIntoLevel(xp: number): number {
  return Math.max(0, xp) % XP_PER_LEVEL;
}

const RANKS: { min: number; title: string }[] = [
  { min: 25, title: "Legend" },
  { min: 17, title: "Pioneer" },
  { min: 12, title: "Voyager" },
  { min: 8, title: "Trailblazer" },
  { min: 5, title: "Pathfinder" },
  { min: 3, title: "Explorer" },
  { min: 1, title: "Wanderer" },
];
export function rankTitle(level: number): string {
  return RANKS.find((r) => level >= r.min)?.title ?? "Wanderer";
}

// --- Per-game scoring --------------------------------------------------------
// Everything is based on HOW FAR the player made it (rounds reached), not how
// many they got right.

/** 0–3 stars by share of the chain reached; clearing it earns 3. */
export function computeStars(reached: number, rounds: number): number {
  if (rounds <= 0) return 0;
  if (reached >= rounds) return 3;
  if (reached >= Math.ceil(rounds * 0.66)) return 2;
  if (reached >= Math.ceil(rounds * 0.33)) return 1;
  return 0;
}

/** Base XP from distance traveled, with a bonus for going the full distance. */
export function basePoints(reached: number, rounds: number): number {
  const cleared = rounds > 0 && reached >= rounds ? 500 : 0;
  return Math.max(0, reached) * 100 + cleared;
}

/** Gentle streak boost: +3% per consecutive day, capped at +60%. */
export function streakMultiplier(streak: number): number {
  return Math.min(1.6, 1 + 0.03 * Math.max(0, streak));
}

export function pointsForGame(reached: number, rounds: number, streak: number): number {
  return Math.round(basePoints(reached, rounds) * streakMultiplier(streak));
}

// --- Achievements ------------------------------------------------------------

export interface AchievementDef {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_game", label: "First Steps", description: "Play your first game.", icon: "🧭" },
  { id: "perfect", label: "Clean Sweep", description: "Clear an entire chain.", icon: "🎯" },
  { id: "flawless", label: "Flawless", description: "Clear a chain without losing a life.", icon: "💎" },
  { id: "streak7", label: "On Fire", description: "Reach a 7-day streak.", icon: "🔥" },
  { id: "streak30", label: "Unstoppable", description: "Reach a 30-day streak.", icon: "⚡" },
  { id: "stars25", label: "Star Collector", description: "Earn 25 total stars.", icon: "✨" },
  { id: "stars100", label: "Constellation", description: "Earn 100 total stars.", icon: "🌟" },
  { id: "level10", label: "Seasoned", description: "Reach level 10.", icon: "🏆" },
];

export interface AchievementContext {
  daysPlayed: number;
  totalStars: number;
  currentStreak: number;
  level: number;
  clearedThisGame: boolean;
  flawlessThisGame: boolean;
}

/** Which achievement ids are satisfied by the current stats / latest game. */
export function earnedAchievementIds(ctx: AchievementContext): string[] {
  const earned: string[] = [];
  if (ctx.daysPlayed >= 1) earned.push("first_game");
  if (ctx.clearedThisGame) earned.push("perfect");
  if (ctx.flawlessThisGame) earned.push("flawless");
  if (ctx.currentStreak >= 7) earned.push("streak7");
  if (ctx.currentStreak >= 30) earned.push("streak30");
  if (ctx.totalStars >= 25) earned.push("stars25");
  if (ctx.totalStars >= 100) earned.push("stars100");
  if (ctx.level >= 10) earned.push("level10");
  return earned;
}
