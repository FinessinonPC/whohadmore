"use client";

/**
 * How many cards this device has finished.
 *
 * Counted here rather than derived from saved game state, because "finished a
 * card" means all four games are done - a fact each game's own storage only
 * knows a quarter of. The results modal mounts exactly once a card is complete,
 * so recording the date from there is the definition rather than an inference.
 *
 * Dates in a set, not a counter: replaying or reopening the same day must not
 * inflate the number.
 */

const KEY = "whm_cards_done";

const readDates = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === "string") : [];
  } catch {
    return [];
  }
};

/** Record a completed card and return the new distinct total. */
export function recordCardCompleted(date: string): number {
  const dates = readDates();
  if (!dates.includes(date)) {
    dates.push(date);
    try {
      // Bounded: only the count matters, and an unbounded array in
      // localStorage on a site people play daily for years is a slow leak.
      window.localStorage.setItem(KEY, JSON.stringify(dates.slice(-400)));
    } catch {
      /* private mode - the count just restarts, which is harmless here */
    }
  }
  return dates.length;
}
