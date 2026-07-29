import { cookies } from "next/headers";
import { CARD_COOKIE, parseCard } from "@/lib/cardCookie";

/**
 * The scores the browser told us it already has for `date`, or null.
 *
 * Reading this lets a page render the FINISHED hub in its first byte of HTML
 * instead of shipping the unfinished ledger and letting the browser correct it
 * after hydration - which looked, correctly, like the page loading twice.
 *
 * Safe to trust: it only ever decides which of two layouts to render first, and
 * the client recomputes from localStorage a moment later either way. The worst a
 * forged cookie can do is show its owner a wrong-looking scorecard for one
 * frame. Nothing is scored, stored, or ranked from it.
 */
export async function finishedCardScores(date: string): Promise<Record<string, number> | null> {
  const card = parseCard((await cookies()).get(CARD_COOKIE)?.value);
  return card && card.date === date ? card.scores : null;
}
