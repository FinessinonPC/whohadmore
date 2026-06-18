// ============================================================================
// Client-side play state (localStorage).
//
// Tracks an anonymous session id and a per-date result so a finished game stays
// finished on this device — we show the saved score instead of letting players
// restart. Reviewing past games / cross-device history arrives with sign-in.
// ============================================================================

const SESSION_KEY = "whohadmore_session_id";
const resultKey = (date: string) => `whohadmore:result:${date}`;
const progressKey = (date: string) => `whohadmore:progress:${date}`;

export interface StoredResult {
  reached: number; // how far they made it (rounds)
  rounds: number; // total rounds
  lives: number;
  timeSeconds: number;
  wrongRounds: number[];
  xpEarned: number;
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

/** Clear a saved result so the date can be replayed. (Testing helper for now.) */
export function clearLocalResult(date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(resultKey(date));
  } catch {
    /* non-fatal */
  }
}

// --- In-progress game state (so leaving mid-game can resume, not restart) ----

export interface ProgressSnapshot {
  currentIndex: number;
  lives: number;
  score: number;
  wrongRounds: number[];
  roundsPlayed: number;
  elapsedSeconds: number;
}

export function getProgress(date: string): ProgressSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(progressKey(date));
    return raw ? (JSON.parse(raw) as ProgressSnapshot) : null;
  } catch {
    return null;
  }
}

export function saveProgress(date: string, snap: ProgressSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(progressKey(date), JSON.stringify(snap));
  } catch {
    /* non-fatal */
  }
}

export function clearProgress(date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(progressKey(date));
  } catch {
    /* non-fatal */
  }
}
