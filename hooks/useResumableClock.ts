"use client";

import { useCallback, useRef } from "react";

/**
 * A clock that survives leaving the page, without punishing you for it.
 *
 * It counts only the time the puzzle is actually open: `seed` restores whatever
 * was banked on a previous visit, and the elapsed total is that plus however
 * long this visit has been running. Closing the tab pauses it.
 *
 * The alternative - storing a start timestamp - would mean a player who got
 * interrupted for an hour came back to a ruined speed bonus. And simply not
 * persisting it at all (what Duality and Mini did) meant a reload reset the
 * clock to zero, which is the exploit this is here to close. Accumulating is
 * the only version that can neither be reset nor run away while you're gone.
 */
export function useResumableClock() {
  const bankedMs = useRef(0);
  const startedAt = useRef<number | null>(null);

  /** Restore time banked on an earlier visit. Call once, on mount. */
  const seed = useCallback((ms: number) => {
    bankedMs.current = Math.max(0, ms);
  }, []);

  /** Begin (or resume) counting. Idempotent - safe to call on every input. */
  const start = useCallback(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
  }, []);

  const elapsedMs = useCallback(
    () => bankedMs.current + (startedAt.current === null ? 0 : Date.now() - startedAt.current),
    []
  );

  const elapsedSeconds = useCallback(() => elapsedMs() / 1000, [elapsedMs]);

  return { seed, start, elapsedMs, elapsedSeconds };
}
