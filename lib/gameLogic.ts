import type { GameCard } from "@/types";

// ============================================================================
// Pure game logic — scoring, lives, chain progression.
// No React, no side effects. Easy to reason about and test.
// ============================================================================

export const STARTING_LIVES = 3;
export const CHAIN_LENGTH = 15; // 15 cards => 14 guessable pairs

export type Side = "left" | "right";

/** The active pair: left = cards[index], right = cards[index + 1]. */
export interface ActivePair {
  left: GameCard;
  right: GameCard;
}

export function getPairAt(cards: GameCard[], index: number): ActivePair | null {
  const left = cards[index];
  const right = cards[index + 1];
  if (!left || !right) return null;
  return { left, right };
}

/**
 * A guess is correct when the chosen card's value is >= the other card's value.
 * Ties count as correct regardless of which side the player chose.
 */
export function isCorrectGuess(
  chosen: Side,
  leftValue: number,
  rightValue: number
): boolean {
  return chosen === "left"
    ? leftValue >= rightValue
    : rightValue >= leftValue;
}

/** True when this index is the final pair in the chain. */
export function isLastPair(index: number, total: number): boolean {
  return index >= total - 2;
}

/** Highest score achievable for a chain of `total` cards. */
export function maxScore(total: number): number {
  return Math.max(0, total - 1);
}

/**
 * Format a stat value for display. Keeps up to one decimal for fractional
 * values (e.g. 30.1 PPG) and adds thousands separators for big ones.
 */
export function formatStat(value: number): string {
  const isInteger = Number.isInteger(value);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInteger ? 0 : 1,
  });
}
