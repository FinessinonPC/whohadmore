// ============================================================================
// The level-up bus. Every game records its result through a different route
// (/api/profile/complete for Chain, /api/modes/complete for the quick games),
// and any of them can be the one that tips the player over. Rather than teach
// four game components how to render a celebration, they all just hand the
// server's `levelUp` payload to this module and a single host - mounted once in
// the layout - renders it.
//
// Deduped by target level and remembered in localStorage: a player who levels
// up, closes the tab before the modal lands, and comes back should not be
// congratulated twice for the same level.
// ============================================================================

import type { LevelUp } from "@/lib/leaderboard";

export type { LevelUp };

type Listener = (next: LevelUp | null) => void;

const SEEN_KEY = "whohadmore:levelSeen";

let pending: LevelUp | null = null;
const listeners = new Set<Listener>();

function highestSeen(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(SEEN_KEY);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function markSeen(level: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, String(Math.max(highestSeen(), level)));
  } catch {
    /* storage disabled - worst case the modal repeats once */
  }
}

/** Record a level the player already holds without celebrating it. Called on
 *  first profile load so an established account doesn't get a party for a
 *  level it reached months ago. */
export function primeLevelSeen(level: number): void {
  if (level > highestSeen()) markSeen(level);
}

/** Queue the server's level-up payload for the celebration host. Ignores
 *  nulls and anything at-or-below a level already celebrated. */
export function queueLevelUp(data: LevelUp | null | undefined): void {
  if (!data || typeof data.to !== "number") return;
  if (data.to <= highestSeen()) return;
  markSeen(data.to);
  pending = data;
  for (const l of listeners) l(pending);
}

/** Clear the current celebration (the host calls this on dismiss). */
export function clearLevelUp(): void {
  pending = null;
  for (const l of listeners) l(null);
}

export function subscribeLevelUp(fn: Listener): () => void {
  listeners.add(fn);
  if (pending) fn(pending);
  return () => {
    listeners.delete(fn);
  };
}
