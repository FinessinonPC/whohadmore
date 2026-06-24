// ============================================================================
// Leaderboard scoring, leveling, and achievements. Pure functions shared by the
// server routes (writing stats) and the UI (display).
// ============================================================================

export interface Profile {
  id: string;
  session_id: string;
  username: string | null;
  xp: number;
  total_score: number;
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
  score: number; // all-time score (total XP accumulated)
  total_stars: number;
  current_streak: number;
  level: number;
}

export interface DailyRow {
  rank: number;
  name: string; // username, or "Anonymous" for players without a profile
  score: number; // combined daily score (correct answers + hearts + speed)
  reached: number; // correct answers
  hearts: number; // lives left at the end (0–3)
  timeSeconds: number | null;
  you: boolean;
}

// --- Levels ------------------------------------------------------------------
// Rising curve: early levels come quickly (rewarding), later ones take longer.
// XP to go from level L to L+1 = 200 + (L-1)*100  (L1->2: 200, L2->3: 300, …).

export function xpForLevel(level: number): number {
  return 200 + (Math.max(1, level) - 1) * 100;
}

export interface LevelInfo {
  level: number;
  into: number; // XP into the current level
  needed: number; // XP needed to finish the current level
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, into: remaining, needed: xpForLevel(level) };
}

export function levelFromXp(xp: number): number {
  return levelInfo(xp).level;
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
// XP is based on HOW FAR the player made it (rounds reached). The collectible
// stat is HEARTS — the lives you finish a game with (0–3) — summed over time.

/** Hearts banked from a game = lives remaining at the end (0–3). */
export function heartsFor(lives: number): number {
  return Math.max(0, Math.min(3, Math.floor(Number.isFinite(lives) ? lives : 0)));
}

// XP weights. Distance is the bulk; clearing adds a bonus; speed is a smaller
// component that breaks ties between players who get equally far.
const DISTANCE_XP = 10; // per round reached
const CLEAR_BONUS = 50; // for going the full distance
const SPEED_XP = 6; // max per round, scaled by how fast you decided
const SPEED_FAST_SEC = 3; // <= this many sec/round => full speed bonus
const SPEED_SLOW_SEC = 9; // >= this many sec/round => no speed bonus

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** 0..1 — how fast the player decided, per round. */
export function speedFactor(timeSeconds: number, reached: number): number {
  if (reached <= 0 || timeSeconds <= 0) return 0;
  const perRound = timeSeconds / reached;
  return clamp01((SPEED_SLOW_SEC - perRound) / (SPEED_SLOW_SEC - SPEED_FAST_SEC));
}

export function speedBonus(reached: number, timeSeconds: number): number {
  return Math.round(Math.max(0, reached) * SPEED_XP * speedFactor(timeSeconds, reached));
}

/** Base XP: distance + clear bonus + a speed component. */
export function basePoints(reached: number, rounds: number, timeSeconds: number): number {
  const distance = Math.max(0, reached) * DISTANCE_XP;
  const clear = rounds > 0 && reached >= rounds ? CLEAR_BONUS : 0;
  return distance + clear + speedBonus(reached, timeSeconds);
}

/** Gentle streak boost: +3% per consecutive day, capped at +60%. */
export function streakMultiplier(streak: number): number {
  return Math.min(1.6, 1 + 0.03 * Math.max(0, streak));
}

export function pointsForGame(
  reached: number,
  rounds: number,
  timeSeconds: number,
  streak: number
): number {
  return Math.round(basePoints(reached, rounds, timeSeconds) * streakMultiplier(streak));
}

// --- Daily score -------------------------------------------------------------
// The daily leaderboard ranks on one number. Weighted, in order: how many you
// got right (the bulk), then the hearts you kept, then how fast you decided.
// No streak multiplier — every day stands on its own.
const DAILY_CORRECT = 100; // per correct answer
const DAILY_HEART = 150; // per heart still held at the end (0–3)
const DAILY_SPEED = 30; // max per correct answer, scaled by decision speed

export function dailyScore(reached: number, hearts: number, timeSeconds: number): number {
  const correct = Math.max(0, reached) * DAILY_CORRECT;
  const heartBonus = heartsFor(hearts) * DAILY_HEART;
  const speed = Math.round(Math.max(0, reached) * DAILY_SPEED * speedFactor(timeSeconds, reached));
  return correct + heartBonus + speed;
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
  { id: "stars25", label: "Heart Collector", description: "Bank 25 hearts.", icon: "❤️" },
  { id: "stars100", label: "Big Heart", description: "Bank 100 hearts.", icon: "💖" },
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
