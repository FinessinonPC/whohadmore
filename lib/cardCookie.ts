// ============================================================================
// The finished-card cookie.
//
// The hub's finished layout depends on scores that live in localStorage, which
// the server can't see - so the server rendered the unfinished ledger, the
// browser hydrated, and only THEN did the receipt appear. On a phone that's a
// visible second of the wrong page: it reads as the page loading twice.
//
// So the client leaves the server a note. When a card is finished the scores go
// into a small cookie; the page reads it and renders the finished layout in the
// very first byte of HTML. The client then recomputes from localStorage and
// lands on the same numbers, so nothing moves.
//
// One card at a time, on purpose. It covers the case that actually matters -
// the card you just finished, which is the one you'll load again - without
// growing a cookie per day forever.
//
// Format: `<date>~<mode>-<score>~<mode>-<score>...`, using only cookie-safe
// characters so it needs no encoding.
// ============================================================================

export const CARD_COOKIE = "whm_card";

export interface CardCookie {
  date: string;
  scores: Record<string, number>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MODE_RE = /^[a-z]+$/;

export function serializeCard(date: string, scores: Record<string, number>): string {
  const parts = Object.entries(scores)
    .filter(([id, s]) => MODE_RE.test(id) && Number.isFinite(s))
    .map(([id, s]) => `${id}-${Math.max(0, Math.round(s))}`);
  return [date, ...parts].join("~");
}

export function parseCard(raw: string | undefined | null): CardCookie | null {
  if (!raw) return null;
  const [date, ...parts] = raw.split("~");
  if (!DATE_RE.test(date ?? "")) return null;
  const scores: Record<string, number> = {};
  for (const part of parts) {
    const i = part.lastIndexOf("-");
    if (i <= 0) continue;
    const id = part.slice(0, i);
    const n = Number(part.slice(i + 1));
    if (MODE_RE.test(id) && Number.isFinite(n) && n >= 0) scores[id] = n;
  }
  if (Object.keys(scores).length === 0) return null;
  return { date, scores };
}

// --- Client helpers ----------------------------------------------------------

/** Two days is enough: it only ever needs to survive until the card rolls over. */
const MAX_AGE = 60 * 60 * 48;

export function writeCardCookie(date: string, scores: Record<string, number>): void {
  if (typeof document === "undefined") return;
  const value = serializeCard(date, scores);
  document.cookie = `${CARD_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

/** Drop the note when it no longer describes a finished card - a stale cookie
 *  would server-render a receipt the client then has to take away, which is the
 *  original bug with the steps reversed. */
export function clearCardCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CARD_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function readCardCookie(): CardCookie | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CARD_COOKIE}=([^;]*)`));
  return parseCard(match?.[1]);
}
