// ============================================================================
// Client-side play state (localStorage).
//
// Tracks an anonymous session id and a per-date result so a finished game stays
// finished on this device - we show the saved score instead of letting players
// restart. Reviewing past games / cross-device history arrives with sign-in.
// ============================================================================

const SESSION_KEY = "whohadmore_session_id";
const resultKey = (date: string) => `whohadmore:result:${date}`;
const progressKey = (date: string) => `whohadmore:progress:${date}`;

export interface StoredResult {
  reached: number; // how many they got right (0..rounds) - drives the score
  rounds: number; // total rounds
  wrongRounds: number[];
  xpEarned: number;
  completedAt: string; // ISO timestamp
}

/** Stable anonymous id, persisted across sessions. (Swapped for user_id later.) */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // If an extension or privacy setting blocks localStorage, return a temporary session
    return "sess_temp_" + Math.random().toString(36).substring(2, 15);
  }
}

/** Adopt an account's canonical session id on this device after sign-in, so all
 *  future plays and reads attach to that account (and prior plays made on this
 *  device's anonymous id have already been merged server-side). */
export function setSessionId(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    window.localStorage.setItem(SESSION_KEY, id);
  } catch {
    /* non-fatal */
  }
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
    /* storage full / disabled - non-fatal */
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
