"use client";

import { getLocalResult } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { chainDailyScore } from "@/lib/leaderboard";
import { LIVE_MODES } from "@/lib/modes";
import { writeCardCookie } from "@/lib/cardCookie";

/**
 * This device's score for each of a date's games, or null where it has none.
 * Local storage only - no server merge - so it's usable from a game screen,
 * where the hub's data isn't loaded.
 */
export function localCardScores(date: string): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const m of LIVE_MODES) {
    if (m.id === "chain") {
      const chain = getLocalResult(date);
      out.chain = chain ? chainDailyScore(chain.reached, chain.rounds) : null;
    } else {
      out[m.id] = getModeResult(m.id, date)?.score ?? null;
    }
  }
  return out;
}

/**
 * Leave the finished-card note for the server the moment the last game ends -
 * NOT when the hub next renders.
 *
 * That distinction is the whole point: finishing the fourth game leaves you on
 * a game screen, where the hub has never mounted, so nothing had written the
 * cookie yet. Walking back to the card (directly, or via the leaderboard) meant
 * the server still thought it was unfinished and served the ledger, which the
 * browser then had to correct - the double load, one navigation later.
 *
 * Write-only on purpose. A game screen can't see games played on another
 * device, so it is never entitled to conclude a card is UNfinished; only the
 * hub, which merges the server's history, may withdraw the note.
 */
export function writeCardCookieIfComplete(date: string): void {
  const scores = localCardScores(date);
  if (!LIVE_MODES.every((m) => typeof scores[m.id] === "number")) return;
  writeCardCookie(
    date,
    Object.fromEntries(LIVE_MODES.map((m) => [m.id, scores[m.id] as number]))
  );
}
