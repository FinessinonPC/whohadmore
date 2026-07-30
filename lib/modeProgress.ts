// ============================================================================
// Mid-game progress for the quick games (Duality / Word / Mini).
//
// Chain has saved an in-flight snapshot since it shipped; the other three only
// ever saved a FINISHED result. That made leaving and coming back a reset - and
// every one of those games scores on something a reset wipes:
//
//   Word     points come from guesses used, so a reload is a fresh six tries
//            while you keep everything you learned about the answer
//   Duality  mistakes cost points, and a reload hands back all three
//   Mini     checks cost points and the clock feeds the speed bonus; a reload
//            zeroes both, which is a free perfect score
//
// So this is a fairness fix, not just a convenience one.
//
// The clock is stored as ACCUMULATED milliseconds rather than a start time.
// Time only runs while the game is open: closing the tab pauses it instead of
// punishing someone who got interrupted, and reopening can never subtract.
// ============================================================================

import type { ModeId } from "@/lib/modes";

export interface ModeProgress<T> {
  state: T;
  /** Milliseconds actually spent on the puzzle, across every visit. */
  elapsedMs: number;
}

const key = (mode: ModeId, date: string) => `whohadmore:progress:${mode}:${date}`;

export function getModeProgress<T>(mode: ModeId, date: string): ModeProgress<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(mode, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ModeProgress<T>>;
    if (!parsed || typeof parsed !== "object" || parsed.state === undefined) return null;
    return {
      state: parsed.state as T,
      elapsedMs: typeof parsed.elapsedMs === "number" && parsed.elapsedMs >= 0 ? parsed.elapsedMs : 0,
    };
  } catch {
    return null;
  }
}

export function saveModeProgress(mode: ModeId, date: string, state: unknown, elapsedMs: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      key(mode, date),
      JSON.stringify({ state, elapsedMs: Math.max(0, Math.round(elapsedMs)) })
    );
  } catch {
    /* storage full or disabled - play is never blocked by this */
  }
}

/** Drop the snapshot once the game is finished; the result is stored elsewhere. */
export function clearModeProgress(mode: ModeId, date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(mode, date));
  } catch {
    /* non-fatal */
  }
}
