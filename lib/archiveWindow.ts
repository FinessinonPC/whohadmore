import { isValidISODate, previousISODate } from "@/lib/date";

/**
 * How many recent days are free to play without an account.
 *
 * This one number decides three things that have to agree, or the site
 * contradicts itself in public:
 *
 *   useArchiveGate   whether a stranger can play the card
 *   middleware       whether Google is allowed to index it
 *   sitemap          whether we tell Google it exists
 *
 * A page that is indexed but gated is the worst of both: a search result that
 * hands a stranger a signup form instead of a puzzle. Which is why every day
 * page was noindexed until now - not because archives are worthless, but
 * because walled ones are.
 *
 * A rolling window rather than all-or-nothing. Recent cards are the ones with
 * any search interest, so opening them buys the indexable surface; the deep
 * archive stays behind the wall, so an account is still worth making. Set to 0
 * to put the wall back exactly where it was.
 */
export const FREE_ARCHIVE_DAYS = 14;

/**
 * Is this date inside the free window, counting back from today?
 *
 * Walks back a day at a time rather than doing arithmetic on Date objects,
 * because the site's "today" is a timezone-aware string and re-deriving it
 * from a UTC timestamp is how off-by-one-day bugs get in.
 */
export function isFreeArchiveDate(date: string, today: string): boolean {
  if (!isValidISODate(date) || !isValidISODate(today)) return false;
  if (date > today) return false; // the future is nobody's free window
  let cursor = today;
  for (let i = 0; i < FREE_ARCHIVE_DAYS; i++) {
    if (date === cursor) return true;
    cursor = previousISODate(cursor);
  }
  return false;
}
