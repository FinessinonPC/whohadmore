// ============================================================================
// Client-side play state (localStorage).
//
// Tracks an anonymous session id and a per-date result so a finished game stays
// finished on this device — we show the saved score instead of letting players
// restart. Reviewing past games / cross-device history arrives with sign-in.
// ============================================================================

const SESSION_KEY = "whohadmore_session_id";
const resultKey = (date: string) => `whohadmore:result:${date}`;

export interface StoredResult {
  score: number;
  best: number;
  lives: number;
  timeSeconds: number;
  completedAt: string; // ISO timestamp
}

/** Stable anonymous id, persisted across sessions. (Swapped for user_id later.) */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getLocalResult(date: string): StoredResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(resultKey(date));
    return raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    return null;
  }
}

export function saveLocalResult(date: string, result: StoredResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(resultKey(date), JSON.stringify(result));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}
