// One-off festive themes tied to a specific puzzle date.

/** US Independence Day - fireworks + festive copy on that day's puzzle only. */
export const JULY_4TH = "2026-07-04";

export function isJuly4th(date: string): boolean {
  return date === JULY_4TH;
}
