// ============================================================================
// "Words already used" across the pack games - so the admin never reuses a
// word when authoring a new day. A word counts as used if it appears in ANY
// stored custom day (daily_minigames) OR in the bundled fallback pack, since
// both can reach players. Derived on read from the stored payloads, so it's
// always current - publishing a game automatically adds its words, no separate
// bookkeeping to drift out of sync.
// ============================================================================

import { DUALITY_PACK, WORD_ANSWERS, MINI_PACK, type DualityDay, type MiniDay } from "@/lib/contentPacks";
import {
  deriveMiniSlots,
  validateDuality,
  validateMini,
  validateWord,
  type MinigameMode,
} from "@/lib/minigameSchemas";

/** The four solution words of a Duality day. */
export function wordsFromDuality(d: DualityDay): string[] {
  return d.pairs.map((p) => p.word.toUpperCase());
}

/** Every across + down fill word of a Mini, read straight off the grid (so it
 *  works whether or not the stored clues carry an `answer`). */
export function wordsFromMini(m: MiniDay): string[] {
  const { across, down } = deriveMiniSlots(m.rows);
  const readAcross = (s: { row: number; col: number; len: number }) =>
    Array.from({ length: s.len }, (_, i) => m.rows[s.row][s.col + i]).join("");
  const readDown = (s: { row: number; col: number; len: number }) =>
    Array.from({ length: s.len }, (_, i) => m.rows[s.row + i][s.col]).join("");
  return [...across.map(readAcross), ...down.map(readDown)].map((w) => w.toUpperCase());
}

/** The one answer of a Word day. */
export function wordsFromWord(answer: string): string[] {
  return [answer.toUpperCase()];
}

/** Words from a raw stored payload; invalid payloads contribute nothing. */
export function wordsFromPayload(mode: MinigameMode, raw: unknown): string[] {
  if (mode === "duality") {
    const v = validateDuality(raw);
    return v.ok ? wordsFromDuality(v.value) : [];
  }
  if (mode === "word") {
    const v = validateWord(raw);
    return v.ok ? wordsFromWord(v.value.answer) : [];
  }
  const v = validateMini(raw);
  return v.ok ? wordsFromMini(v.value) : [];
}

/** Every word baked into the bundled fallback pack for a mode. */
export function packWords(mode: MinigameMode): string[] {
  if (mode === "duality") return DUALITY_PACK.flatMap(wordsFromDuality);
  if (mode === "word") return WORD_ANSWERS.map((w) => w.toUpperCase());
  return MINI_PACK.flatMap(wordsFromMini);
}

/** Uppercase, trim, drop blanks/black-square fragments, de-dupe, sort. */
export function dedupeSorted(words: string[]): string[] {
  const set = new Set<string>();
  for (const w of words) {
    const clean = w.trim().toUpperCase();
    if (clean && !clean.includes("#")) set.add(clean);
  }
  return Array.from(set).sort();
}
