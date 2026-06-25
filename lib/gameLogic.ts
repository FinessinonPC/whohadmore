import type { GameCard } from "@/types";

// ============================================================================
// Pure game logic — scoring, lives, chain progression.
// No React, no side effects. Easy to reason about and test.
// ============================================================================

export const STARTING_LIVES = 3;
export const CHAIN_LENGTH = 16; // 16 cards => 15 guessable rounds

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

/**
 * Reorder so no two ADJACENT cards share the same stat_value — that way a pair
 * is never a tie. Greedy: when neighbors match, swap the later card forward.
 */
export function avoidAdjacentTies<T extends { stat_value: number }>(cards: T[]): T[] {
  const out = [...cards];
  for (let i = 1; i < out.length; i++) {
    if (out[i].stat_value === out[i - 1].stat_value) {
      let j = i + 1;
      while (j < out.length && out[j].stat_value === out[i - 1].stat_value) j++;
      if (j < out.length) [out[i], out[j]] = [out[j], out[i]];
      // else: every remaining card ties — unavoidable, leave as-is.
    }
  }
  return out;
}
