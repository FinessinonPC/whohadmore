// ============================================================================
// Date helpers. A "play_date" is always a calendar date string "YYYY-MM-DD".
// We anchor "today" to US Eastern so the daily game flips at a predictable
// time for everyone, NYT-style.
// ============================================================================

const GAME_TZ = "America/New_York";

/** Today's play date ("YYYY-MM-DD") in the game's canonical timezone. */
export function todayISO(): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the shape we store.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GAME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Validate a "YYYY-MM-DD" string and confirm it's a real calendar date. */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** "2026-06-15" -> "June 15, 2026" */
export function formatDisplayDate(value: string): string {
  if (!isValidISODate(value)) return value;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "2026-06-15" -> "Jun 15" (compact, for archive/calendar cells). */
export function formatShortDate(value: string): string {
  if (!isValidISODate(value)) return value;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function isToday(value: string): boolean {
  return value === todayISO();
}

/** "2026-06-15" -> "2026-06-14" */
export function previousISODate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/** "2026-06-15" -> "2026-06" (leaderboard period key) */
export function monthPeriod(value: string): string {
  return value.slice(0, 7);
}

export function isFuture(value: string): boolean {
  return value > todayISO();
}

/**
 * Milliseconds from now until the next midnight in the game timezone. Used to
 * auto-roll the daily game over to the next day at 12am ET without a reload.
 */
export function msUntilNextGameMidnight(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GAME_TZ,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now); // "HH:MM:SS" (00..23)
  const [h, m, s] = parts.split(":").map(Number);
  const msIntoDay = ((h % 24) * 3600 + m * 60 + s) * 1000 + now.getMilliseconds();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1000, msPerDay - msIntoDay);
}
