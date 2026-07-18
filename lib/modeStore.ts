// ============================================================================
// Client-side results for the extra daily modes (rank, pinpoint). Same idea as
// playStore's chain result: one finished result per mode per date, on-device.
// ============================================================================

import type { ModeId } from "@/lib/modes";

export interface ModeResult {
  score: number;
  maxScore: number;
  detail: number[]; // per-slot / per-round points for the result breakdown
  completedAt: string;
  /** Optional finished-board state (e.g. Word's guesses) so the "already
   *  played" view can show the completed puzzle, not just the score. */
  state?: unknown;
  // Typed detail for the profile's per-game stats (newer saves only).
  seconds?: number; // solve time (duality/mini)
  moves?: number; // word: guesses · duality: mistakes · mini: checks
  won?: boolean; // word: solved · duality: all pairs · mini: no reveal
}

const key = (mode: ModeId, date: string) => `whohadmore:${mode}:${date}`;
const keyPrefix = (mode: ModeId) => `whohadmore:${mode}:`;

export function getModeResult(mode: ModeId, date: string): ModeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(mode, date));
    return raw ? (JSON.parse(raw) as ModeResult) : null;
  } catch {
    return null;
  }
}

export function saveModeResult(mode: ModeId, date: string, result: ModeResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(mode, date), JSON.stringify(result));
  } catch {
    /* storage full / disabled - non-fatal */
  }
}

/** Every result saved on THIS device for a mode, keyed by date - used by the
 *  profile's stats to fill in detail the server doesn't have for older days. */
export function getAllModeResults(mode: ModeId): Record<string, ModeResult> {
  if (typeof window === "undefined") return {};
  const out: Record<string, ModeResult> = {};
  const prefix = keyPrefix(mode);
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const date = k.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      try {
        const parsed = JSON.parse(window.localStorage.getItem(k) ?? "") as ModeResult;
        if (parsed && typeof parsed.score === "number") out[date] = parsed;
      } catch {
        /* one bad entry never hides the rest */
      }
    }
  } catch {
    return out;
  }
  return out;
}
