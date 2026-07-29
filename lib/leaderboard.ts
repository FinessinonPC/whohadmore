// ============================================================================
// Leaderboard scoring, leveling, and achievements. Pure functions shared by the
// server routes (writing stats) and the UI (display).
// ============================================================================

export interface Profile {
  id: string;
  session_id: string;
  username: string | null;
  email: string | null;
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
  name: string; // username, or "Unknown####" for players without a profile
  anon: boolean; // true when this player has no claimed username
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
// stat is HEARTS - the lives you finish a game with (0–3) - summed over time.

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

/** 0..1 - how fast the player decided, per round. Decays smoothly with time and
 *  never floors to 0, so a faster run always outscores a slower one with the same
 *  correct answers and hearts (no more identical scores on the leaderboard). */
export function speedFactor(timeSeconds: number, reached: number): number {
  if (reached <= 0 || timeSeconds <= 0) return 0;
  const perRound = timeSeconds / reached;
  return Math.min(1, SPEED_FAST_SEC / perRound);
}

export function speedBonus(reached: number, timeSeconds: number): number {
  return Math.round(Math.max(0, reached) * SPEED_XP * speedFactor(timeSeconds, reached));
}

/** Base XP: how many you got right + a bonus for a full clear. Chain has no
 *  time component, so XP is purely about correct calls. */
export function basePoints(reached: number, rounds: number): number {
  const distance = Math.max(0, reached) * DISTANCE_XP; // per correct answer
  const clear = rounds > 0 && reached >= rounds ? CLEAR_BONUS : 0;
  return distance + clear;
}

/** Gentle streak boost: +3% per consecutive day, capped at +60%. */
export function streakMultiplier(streak: number): number {
  return Math.min(1.6, 1 + 0.03 * Math.max(0, streak));
}

/** The streak as it stands *right now*, for display. The stored value is only
 *  reconciled on the next play, so a player who missed a day would otherwise see
 *  a stale number - here it reads as broken (0) unless they played today or
 *  yesterday. */
export function effectiveStreak(
  streak: number,
  lastPlayedDate: string | null,
  today: string,
  yesterday: string
): number {
  if (!lastPlayedDate) return 0;
  if (lastPlayedDate === today || lastPlayedDate === yesterday) return Math.max(0, streak);
  return 0;
}

export function pointsForGame(reached: number, rounds: number, streak: number): number {
  return Math.round(basePoints(reached, rounds) * streakMultiplier(streak));
}

// --- Daily score -------------------------------------------------------------
// The daily leaderboard ranks on one number. Weighted, in order: how many you
// got right (the bulk), then the hearts you kept, then how fast you decided.
// No streak multiplier - every day stands on its own.
const DAILY_CORRECT = 100; // per correct answer
const DAILY_HEART = 150; // per heart still held at the end (0–3)
const DAILY_SPEED = 30; // max per correct answer, scaled by decision speed

export function dailyScore(reached: number, hearts: number, timeSeconds: number): number {
  const correct = Math.max(0, reached) * DAILY_CORRECT;
  const heartBonus = heartsFor(hearts) * DAILY_HEART;
  const speed = Math.round(Math.max(0, reached) * DAILY_SPEED * speedFactor(timeSeconds, reached));
  return correct + heartBonus + speed;
}

// --- Chain's daily points (0–1000) -------------------------------------------
// No hearts, no time: you play the whole chain and your score is simply the
// share you got right, on the same 0–1000 scale as the other games. All correct
// = 1000, so no game outweighs another.
export function chainDailyScore(reached: number, rounds: number): number {
  if (rounds <= 0) return 0;
  const correct = Math.max(0, Math.min(reached, rounds));
  return Math.round((correct / rounds) * 1000);
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
  { id: "perfect", label: "Clean Sweep", description: "Get every call right in a Chain.", icon: "🎯" },
  { id: "streak7", label: "On Fire", description: "Reach a 7-day streak.", icon: "🔥" },
  { id: "streak30", label: "Unstoppable", description: "Reach a 30-day streak.", icon: "⚡" },
  { id: "level10", label: "Seasoned", description: "Reach level 10.", icon: "🏆" },
  // Collection achievements - earned across the whole roster, granted by the
  // quick-game recorder (/api/modes/complete).
  { id: "all_rounder", label: "The Full Sweep", description: "Play all four games in one day.", icon: "🃏" },
  { id: "duality_perfect", label: "Mind Reader", description: "Solve Duality without a single mistake.", icon: "🧠" },
  { id: "word_ace", label: "Third Try's a Charm", description: "Solve Word in three guesses or fewer.", icon: "✍️" },
  { id: "mini_clean", label: "Ink Only", description: "Solve the Mini without using Check.", icon: "🖋️" },
  // Skill achievements - need the per-game detail recorded with each result.
  { id: "word_two", label: "Mind Meld", description: "Solve Word in two guesses or fewer.", icon: "🔮" },
  { id: "mini_speed", label: "Speed Solver", description: "Finish the Mini in under a minute.", icon: "⏱️" },
  { id: "thousand_club", label: "Perfect Thousand", description: "Score a perfect 1,000 in any game.", icon: "💯" },
  { id: "century", label: "Century Club", description: "Play 100 games in total.", icon: "🏅" },
];

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Look up an achievement definition by id (for rendering badges). */
export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_BY_ID.get(id);
}

export interface AchievementContext {
  daysPlayed: number;
  currentStreak: number;
  level: number;
  /** True when every call in the Chain was right (a full clear). */
  clearedThisGame: boolean;
}

/** Which achievement ids are satisfied by the current stats / latest game. */
export function earnedAchievementIds(ctx: AchievementContext): string[] {
  const earned: string[] = [];
  if (ctx.daysPlayed >= 1) earned.push("first_game");
  // A full Chain clear is exactly 1,000 daily points, so it's also the
  // perfect-score badge.
  if (ctx.clearedThisGame) earned.push("perfect", "thousand_club");
  if (ctx.currentStreak >= 7) earned.push("streak7");
  if (ctx.currentStreak >= 30) earned.push("streak30");
  if (ctx.level >= 10) earned.push("level10");
  return earned;
}
