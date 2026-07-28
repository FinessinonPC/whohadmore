// ============================================================================
// The two "I finished a game" POSTs, in one place. Both are fire-and-forget by
// design - the end screen never waits on them - but both can come back with a
// `levelUp` payload, and that has to reach the celebration host. Wrapping them
// here means a game component can't accidentally record a result and drop the
// level-up on the floor.
// ============================================================================

import { queueLevelUp } from "@/lib/levelUp";

async function post(url: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { levelUp?: unknown };
    queueLevelUp(data?.levelUp as never);
  } catch {
    /* recording is best-effort - never block or break the end screen */
  }
}

/** Record a finished quick game (Duality / Word / Mini). */
export function recordModeResult(body: {
  session_id: string;
  play_date: string;
  mode: string;
  score: number;
  clean?: boolean;
  seconds?: number;
  moves?: number;
  won?: boolean;
}): void {
  void post("/api/modes/complete", body);
}

/** Record a finished Chain run. */
export function recordChainResult(body: {
  session_id: string;
  play_date: string;
  reached: number;
  rounds: number;
}): void {
  void post("/api/profile/complete", body);
}
