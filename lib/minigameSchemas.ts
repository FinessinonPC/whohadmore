// ============================================================================
// Payload validation for the pack games' custom content (daily_minigames).
// Pure functions - used by BOTH the admin UI (client, to validate pasted AI
// JSON before saving) and the admin API (server, to never trust the wire).
// A Mini payload is only accepted if the grid, slots, numbering, and answers
// all agree - so a hallucinated crossword can never reach players.
// ============================================================================

import type { DualityDay, MiniClue, MiniDay } from "@/lib/contentPacks";

export type MinigameMode = "duality" | "word" | "mini";

export interface WordPayload {
  answer: string;
}

export type MinigamePayload = DualityDay | WordPayload | MiniDay;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// --- Duality -----------------------------------------------------------------

export function validateDuality(raw: unknown): Result<DualityDay> {
  const p = raw as Partial<DualityDay>;
  if (!p || typeof p !== "object") return { ok: false, error: "Not an object." };
  if (!Array.isArray(p.pairs) || p.pairs.length !== 4)
    return { ok: false, error: "Needs exactly 4 pairs (easiest first)." };
  const words = new Set<string>();
  const defs = new Set<string>();
  const pairs = [];
  for (const pr of p.pairs) {
    if (!pr || typeof pr.word !== "string" || !pr.word.trim())
      return { ok: false, error: "Every pair needs a 'word'." };
    const word = pr.word.trim().toUpperCase();
    if (words.has(word)) return { ok: false, error: `Duplicate word: ${word}` };
    words.add(word);
    if (!Array.isArray(pr.defs) || pr.defs.length !== 2)
      return { ok: false, error: `${word}: needs exactly 2 definitions.` };
    const cleaned: string[] = [];
    for (const d of pr.defs) {
      if (typeof d !== "string" || !d.trim())
        return { ok: false, error: `${word}: empty definition.` };
      const key = d.trim().toLowerCase();
      if (defs.has(key)) return { ok: false, error: `Duplicate definition: "${d.trim()}"` };
      defs.add(key);
      if (d.trim().toUpperCase().includes(word))
        return { ok: false, error: `${word}: a definition contains the word itself.` };
      cleaned.push(d.trim());
    }
    pairs.push({ word, defs: [cleaned[0], cleaned[1]] as [string, string] });
  }
  return { ok: true, value: { pairs } };
}

// --- Word ---------------------------------------------------------------------

export function validateWord(raw: unknown): Result<WordPayload> {
  const p = raw as Partial<WordPayload>;
  const answer = typeof p?.answer === "string" ? p.answer.trim().toUpperCase() : "";
  if (!/^[A-Z]{5}$/.test(answer)) return { ok: false, error: "Answer must be exactly 5 letters." };
  return { ok: true, value: { answer } };
}

// --- Mini ----------------------------------------------------------------------

/** Derive the across/down slots + standard numbering from a grid. */
export function deriveMiniSlots(rows: string[]) {
  const N = 5;
  const open = (r: number, c: number) => r >= 0 && r < N && c >= 0 && c < N && rows[r][c] !== "#";
  let num = 0;
  const across: { num: number; row: number; col: number; len: number }[] = [];
  const down: { num: number; row: number; col: number; len: number }[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (!open(r, c)) continue;
      const startsA = !open(r, c - 1) && open(r, c + 1);
      const startsD = !open(r - 1, c) && open(r + 1, c);
      if (!startsA && !startsD) continue;
      num++;
      if (startsA) {
        let len = 0;
        while (open(r, c + len)) len++;
        across.push({ num, row: r, col: c, len });
      }
      if (startsD) {
        let len = 0;
        while (open(r + len, c)) len++;
        down.push({ num, row: r, col: c, len });
      }
    }
  return { across, down };
}

export function validateMini(raw: unknown): Result<MiniDay> {
  const p = raw as Partial<MiniDay>;
  if (!p || typeof p !== "object") return { ok: false, error: "Not an object." };
  if (!Array.isArray(p.rows) || p.rows.length !== 5 || p.rows.some((r) => typeof r !== "string" || !/^[A-Z#]{5}$/.test(r)))
    return { ok: false, error: "rows must be 5 strings of 5 chars (A-Z or #)." };
  const rows = p.rows as string[];

  // Every open cell must be part of an across AND a down run of >= 2? No - of
  // length >= 2 in at least one direction and every run >= 2 becomes a slot.
  // Reject 1-cell islands (unclued letters).
  const { across, down } = deriveMiniSlots(rows);
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++) {
      if (rows[r][c] === "#") continue;
      const inA = across.some((s) => s.row === r && c >= s.col && c < s.col + s.len);
      const inD = down.some((s) => s.col === c && r >= s.row && r < s.row + s.len);
      if (!inA && !inD) return { ok: false, error: `Letter at row ${r + 1}, col ${c + 1} belongs to no clue.` };
    }

  const checkSide = (
    given: unknown,
    slots: { num: number; row: number; col: number; len: number }[],
    dir: "across" | "down"
  ): Result<MiniClue[]> => {
    if (!Array.isArray(given) || given.length !== slots.length)
      return { ok: false, error: `Expected ${slots.length} ${dir} clues, got ${Array.isArray(given) ? given.length : 0}.` };
    const out: MiniClue[] = [];
    for (const slot of slots) {
      const clue = (given as Partial<MiniClue>[]).find((c) => c.num === slot.num);
      if (!clue) return { ok: false, error: `Missing ${dir} clue #${slot.num}.` };
      if (typeof clue.clue !== "string" || !clue.clue.trim())
        return { ok: false, error: `${dir} #${slot.num} needs clue text.` };
      let answer = "";
      for (let i = 0; i < slot.len; i++)
        answer += dir === "across" ? rows[slot.row][slot.col + i] : rows[slot.row + i][slot.col];
      if (typeof clue.answer === "string" && clue.answer.trim().toUpperCase() !== answer)
        return { ok: false, error: `${dir} #${slot.num}: answer '${clue.answer}' doesn't match grid '${answer}'.` };
      out.push({ ...slot, clue: clue.clue.trim(), answer });
    }
    return { ok: true, value: out };
  };

  const a = checkSide(p.across, across, "across");
  if (!a.ok) return a;
  const d = checkSide(p.down, down, "down");
  if (!d.ok) return d;
  return { ok: true, value: { rows, across: a.value, down: d.value } };
}

export function validateMinigame(mode: MinigameMode, raw: unknown): Result<MinigamePayload> {
  if (mode === "duality") return validateDuality(raw);
  if (mode === "word") return validateWord(raw);
  return validateMini(raw);
}
