"use client";

// ============================================================================
// STUB - not wired up yet.
//
// `game_results` carries a `play_date` per completed game, so a streak is just
// a query for consecutive calendar dates ending today (per session_id now,
// per user_id once auth lands). This hook will own that calculation.
// ============================================================================

export interface StreakState {
  current: number;
  longest: number;
  loading: boolean;
}

export function useStreak(): StreakState {
  // TODO: query consecutive play_dates from game_results once we decide whether
  // streaks are session- or account-scoped.
  return { current: 0, longest: 0, loading: false };
}
