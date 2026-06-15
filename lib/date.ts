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

export function isFuture(value: string): boolean {
  return value > todayISO();
}
