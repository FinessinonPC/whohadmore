"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { adminFetch, enableAdminPreview } from "@/lib/adminClient";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import {
  deriveMiniSlots,
  validateMinigame,
  type MinigameMode,
} from "@/lib/minigameSchemas";
import { MINI_SKELETONS, findMatchingSkeleton, type MiniSkeleton } from "@/lib/miniSkeletons";
import type { DualityDay, MiniDay } from "@/lib/contentPacks";

const MODE_META: { id: MinigameMode; accent: string; blurb: string }[] = [
  { id: "duality", accent: "#06B6D4", blurb: "8 definitions, 4 hidden pairs" },
  { id: "word", accent: "#FFC400", blurb: "The daily five-letter answer" },
  { id: "mini", accent: "#2E6BFF", blurb: "5x5 crossword grid + clues" },
];

const PROMPTS: Record<"duality" | "word", string> = {
  duality: `You are a puzzle editor at the level of the NYT Games desk, writing today's "Duality" - a daily pairing game with a devoted audience. Players see EIGHT short definitions, shuffled. Hidden among them are FOUR PAIRS: each pair is two definitions of the SAME word with two unrelated meanings ("Place that holds your money" + "The side of a river" = BANK). Players tap two that go together; matches reveal the word.

Editorial bar (what makes a great day):
1) The aha. Every pair should produce a small delight when the word reveals - the second meaning should feel obvious IN HINDSIGHT, never contrived. If you have to squint, cut it.
2) Fair. Both definitions are unmistakably correct for the word, and NO definition could plausibly describe a different pair's word. One clean answer, always.
3) Tight writing. Definitions are 3-6 words, concrete, and evocative - written like crossword clues, not dictionary entries. Never include the answer word (or any form of it) in a definition.
4) Make it CHALLENGING. Pair 1 can be a warm-up, but Pairs 2, 3, and 4 should be brain-benders. Use extremely clever misdirection, rarely-used but valid secondary meanings, and words that act as both nouns and verbs with completely different contexts. Make the player sweat.
5) Everyday words only - but rely on their least commonly used definitions to crank up the difficulty. Light and safe: no politics, religion, or tragedy.
6) Before answering, self-check every rule above against each pair.

Return ONLY this JSON, no markdown fences:
{
  "pairs": [
    { "word": "BANK", "defs": ["Place that holds your money", "The side of a river"] }
    // exactly 4 pairs, easiest first
  ]
}`,
  word: `You are the editor picking today's answer for a daily five-letter word game (the beloved format). The pick matters: a good answer feels satisfying to land on; a bad one makes players feel cheated.

Editorial bar:
1) Exactly 5 letters, a word EVERY adult knows - no obscurities, no proper nouns, no plurals ending in S, no crossword-ese.
2) Satisfying to discover: vivid, concrete words (STORM, CRISP, MANGO) beat gray filler (OTHER, THEIR). A word with personality.
3) A touch of challenge is welcome - a double letter or an uncommon-but-fair pattern - but never at the cost of rule 1.
4) Self-check: five letters exactly, common, singular.

Return ONLY this JSON, no markdown fences:
{ "answer": "STORM" }`,
};

/**
 * The Mini prompt is generated from whichever skeleton is selected, instead of
 * hardcoded - so the grid diagram, the slot coordinates, and the JSON schema
 * the AI sees always agree with each other (and with the manual grid editor)
 * by construction. Fixing the black-square layout is the actual unlock: the
 * AI only ever has to fill words into a pre-solved shape, never invent one.
 */
function miniPromptFor(skeleton: MiniSkeleton): string {
  const { across, down } = deriveMiniSlots(skeleton.rows);
  const acrossList = across.map((s) => `${s.num}A row${s.row} col${s.col} len${s.len}`).join(" · ");
  const downList = down.map((s) => `${s.num}D row${s.row} col${s.col} len${s.len}`).join(" · ");
  const jsonSlot = (s: { num: number; row: number; col: number; len: number }) =>
    `    { "num": ${s.num}, "row": ${s.row}, "col": ${s.col}, "len": ${s.len}, "clue": "...", "answer": "..." }`;

  return `You are a crossword constructor building ONE 5x5 mini crossword with NYT-Mini standards: a clean fill of everyday words and clues with a wink. The grid layout below is ALREADY DECIDED - do not change it, do not invent black-square placement. Your only job is choosing words that fit the fixed slots and writing clues for them.

GRID (# = black square, letters go everywhere else):
${skeleton.rows.join("\n")}

FIXED SLOTS (0-indexed row/col - use these exact numbers/positions):
ACROSS: ${acrossList}
DOWN:   ${downList}

METHOD - follow these steps in order, don't skip ahead to clue-writing:
1. Choose the ACROSS words first (real, common, everyday English words - no abbreviations, no proper nouns, no crossword-ese). Write them out.
2. For each DOWN slot, list the letters your across words already lock in at every intersecting cell. Do this for every down slot before picking any down word.
3. Find a word for every DOWN slot that satisfies ALL of its locked letters simultaneously. If no common word fits a slot's constraints, go back to step 1 and swap ONE across word - don't restart from scratch, just change the word causing the conflict.
4. Write out the finished grid as 5 literal rows of text.
5. VERIFY: read each down answer straight off the grid you just wrote (top-to-bottom in its column) and compare it letter-by-letter to what you intended. If even one letter is off, fix the grid now, before answering - a single wrong crossing invalidates the whole puzzle.
6. Only now write the clues: short, fair, and warm - a small smile beats a groan. Clue the meaning players know best. Never let a clue contain the answer word itself. The 10 words must all be different. IMPORTANT: Do NOT use double quotes (") anywhere inside the clue text, as it will break the JSON. Use single quotes (') instead if needed.

Return ONLY this JSON, no markdown fences (rows use UPPERCASE letters and '#'):
{
  "rows": ["...", "...", "...", "...", "..."],
  "across": [
${across.map(jsonSlot).join(",\n")}
  ],
  "down": [
${down.map(jsonSlot).join(",\n")}
  ]
}`;
}

/** duality/word have one fixed prompt; mini's depends on the chosen skeleton. */
function promptFor(mode: MinigameMode, skeleton: MiniSkeleton): string {
  if (mode === "mini") return miniPromptFor(skeleton);
  return PROMPTS[mode];
}

/** Tolerant JSON extraction (same spirit as the chain game's AI panel). */
function extractJson(raw: string): unknown | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const candidates = [text];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      /* next */
    }
  }
  return null;
}

interface Effective {
  duality?: DualityDay;
  word?: { answer: string };
  mini?: MiniDay;
}

/**
 * Admin control for the three quick games on a date. Every game shows its
 * ACTUAL content for the day (custom or auto pack), can be previewed on the
 * real page, and edited two ways: a structured form (no JSON in sight) or
 * the copy-prompt/paste-JSON AI flow. Everything validates hard before save.
 */
export function MinigamesPanel({ date }: { date: string }) {
  const [custom, setCustom] = useState<Record<string, unknown>>({});
  const [effective, setEffective] = useState<Effective>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<MinigameMode | null>(null);
  const [tab, setTab] = useState<"form" | "ai">("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiText, setAiText] = useState("");

  // Form state
  const [pairs, setPairs] = useState<{ word: string; a: string; b: string }[]>([]);
  const [answer, setAnswer] = useState("");
  const [skeletonId, setSkeletonId] = useState(MINI_SKELETONS[0].id);
  const skeleton = useMemo(
    () => MINI_SKELETONS.find((s) => s.id === skeletonId) ?? MINI_SKELETONS[0],
    [skeletonId]
  );
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: 5 }, () => Array(5).fill(""))
  );
  const [clues, setClues] = useState<Record<string, string>>({});

  const miniSlots = useMemo(() => deriveMiniSlots(skeleton.rows), [skeleton]);

  /** Blank grid for a skeleton: black squares pre-filled, everything else empty. */
  function blankGrid(sk: MiniSkeleton): string[][] {
    return Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => (sk.rows[r][c] === "#" ? "#" : ""))
    );
  }

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/minigame?date=${date}`);
      const data = (await res.json()) as {
        custom?: Record<string, unknown>;
        effective?: Effective;
        error?: string;
      };
      setCustom(data.custom ?? {});
      setEffective(data.effective ?? {});
      setNotice(
        data.error === "query_failed"
          ? "daily_minigames table not found - run supabase/migrations/0005_daily_minigames.sql to save custom days."
          : null
      );
    } catch {
      setCustom({});
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Prefill the form from the day's effective content. */
  function openEditor(mode: MinigameMode) {
    setSheetMode(mode);
    setTab("form");
    setError(null);
    setAiText("");
    if (mode === "duality") {
      const d = effective.duality;
      setPairs(
        d?.pairs.map((p) => ({ word: p.word, a: p.defs[0], b: p.defs[1] })) ??
          Array.from({ length: 4 }, () => ({ word: "", a: "", b: "" }))
      );
    } else if (mode === "word") {
      setAnswer(effective.word?.answer ?? "");
    } else {
      const m = effective.mini;
      // Detect which skeleton the day's actual content uses (by black-square
      // shape) so editing an existing custom Mini opens on the right layout,
      // pre-filled. New/unrecognized shapes default to the first skeleton.
      const matched = m ? findMatchingSkeleton(m.rows) : undefined;
      const useSkeleton = matched ?? MINI_SKELETONS[0];
      setSkeletonId(useSkeleton.id);
      setGrid(
        Array.from({ length: 5 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) =>
            useSkeleton.rows[r][c] === "#" ? "#" : matched && m ? m.rows[r][c] : ""
          )
        )
      );
      const cl: Record<string, string> = {};
      if (matched && m) {
        for (const s of m.across) cl[`${s.num}A`] = s.clue;
        for (const s of m.down) cl[`${s.num}D`] = s.clue;
      }
      setClues(cl);
    }
  }

  /** Switch grid shape mid-edit: reset to a blank grid for the new skeleton. */
  function changeSkeleton(sk: MiniSkeleton) {
    if (sk.id === skeletonId) return;
    setSkeletonId(sk.id);
    setGrid(blankGrid(sk));
    setClues({});
  }

  /** Build the payload from whichever tab is active, validate, save. */
  async function save() {
    if (!sheetMode) return;
    let payload: unknown;
    if (tab === "ai") {
      payload = extractJson(aiText);
      if (!payload) {
        setError("Couldn't parse that. Paste the raw JSON the model returned.");
        return;
      }
    } else if (sheetMode === "duality") {
      payload = { pairs: pairs.map((p) => ({ word: p.word, defs: [p.a, p.b] })) };
    } else if (sheetMode === "word") {
      payload = { answer };
    } else {
      const rows = grid.map((row) => row.map((ch) => (ch === "" ? "?" : ch)).join(""));
      payload = {
        rows,
        across: miniSlots.across.map((s) => ({
          ...s,
          clue: clues[`${s.num}A`] ?? "",
          answer: Array.from({ length: s.len }, (_, i) => grid[s.row][s.col + i]).join(""),
        })),
        down: miniSlots.down.map((s) => ({
          ...s,
          clue: clues[`${s.num}D`] ?? "",
          answer: Array.from({ length: s.len }, (_, i) => grid[s.row + i][s.col]).join(""),
        })),
      };
    }
    const v = validateMinigame(sheetMode, payload);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/minigame", {
        method: "POST",
        body: JSON.stringify({ date, mode: sheetMode, payload: v.value }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed.");
        return;
      }
      setSheetMode(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function clear(mode: MinigameMode) {
    if (!confirm(`Remove the custom ${mode} for ${date}? The day falls back to the auto pack.`)) return;
    await adminFetch("/api/admin/minigame", {
      method: "DELETE",
      body: JSON.stringify({ date, mode }),
    });
    await load();
  }

  async function copyPrompt() {
    if (!sheetMode) return;
    try {
      await navigator.clipboard.writeText(promptFor(sheetMode, skeleton));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* prompt is visible to copy manually */
    }
  }

  /** One-line summary of the day's effective content per game. */
  function summary(mode: MinigameMode): string {
    if (mode === "duality")
      return effective.duality?.pairs.map((p) => p.word).join(" · ") ?? "…";
    if (mode === "word") return effective.word?.answer ?? "…";
    const m = effective.mini;
    return m ? `${m.across[0]?.answer ?? ""} … ${m.down[m.down.length - 1]?.answer ?? ""} (${m.across.length + m.down.length} clues)` : "…";
  }

  const previewHref = (mode: MinigameMode) => `/${mode}/${date}?preview=1`;

  return (
    <section className="rounded-2xl border border-border bg-surface/50 p-5" id="quick-games">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold text-ink">The quick games</h2>
        <span className="text-[11px] font-semibold text-ink-secondary">
          Auto = pack rotation · Custom = this day only
        </span>
      </div>
      {notice && (
        <p className="mt-2 rounded-lg border border-[#FFB300]/40 bg-[#FFB300]/10 px-3 py-2 text-xs font-semibold text-ink">
          {notice}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2.5">
        {MODE_META.map((m) => {
          const isCustom = Boolean(custom[m.id]);
          return (
            <div key={m.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0" style={{ color: m.accent }}>
                  <GameWordmark mode={m.id} className="text-lg" />
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    isCustom
                      ? "border-correct/40 bg-correct/10 text-correct"
                      : "border-border bg-surface text-ink-secondary"
                  }`}
                >
                  {isCustom ? "Custom" : "Auto"}
                </span>
                <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-ink-secondary">
                  {summary(m.id)}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEditor(m.id)}>
                  View &amp; edit
                </Button>
                <a
                  href={previewHref(m.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => enableAdminPreview()}
                  className="rounded-2xl bg-surface px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-border/40"
                >
                  Preview ↗
                </a>
                {isCustom && (
                  <button
                    onClick={() => void clear(m.id)}
                    className="ml-auto text-xs font-semibold text-ink-secondary hover:text-wrong"
                  >
                    Revert to auto
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-ink-secondary">
        Preview opens the page players see. Edits apply after saving.
      </p>

      <Sheet open={sheetMode !== null} onClose={() => setSheetMode(null)}>
        {sheetMode && (
          <>
            <div className="flex items-center justify-between">
              <span style={{ color: MODE_META.find((m) => m.id === sheetMode)?.accent }}>
                <GameWordmark mode={sheetMode} className="text-2xl" />
              </span>
              <div className="inline-flex rounded-full bg-surface p-1">
                {(["form", "ai"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
                      tab === t ? "bg-background text-ink shadow-sm" : "text-ink-secondary"
                    }`}
                  >
                    {t === "form" ? "Edit" : "AI"}
                  </button>
                ))}
              </div>
            </div>

            {sheetMode === "mini" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {MINI_SKELETONS.map((sk) => (
                  <button
                    key={sk.id}
                    onClick={() => changeSkeleton(sk)}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      skeletonId === sk.id
                        ? "border-ink bg-background"
                        : "border-border bg-surface hover:border-ink/30"
                    }`}
                  >
                    <span className="block text-xs font-bold text-ink">{sk.label}</span>
                    <span className="block text-[10px] text-ink-secondary">{sk.hint}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === "form" ? (
              <div className="mt-4">
                {sheetMode === "duality" && (
                  <div className="flex flex-col gap-3">
                    {pairs.map((p, i) => (
                      <div key={i} className="rounded-xl border border-border bg-surface p-3">
                        <div className="flex items-center gap-2">
                          <span className="small-caps text-[10px] font-bold text-ink-secondary">
                            Pair {i + 1} {i === 0 ? "(easiest)" : i === 3 ? "(hardest)" : ""}
                          </span>
                          <input
                            value={p.word}
                            onChange={(e) =>
                              setPairs((ps) => ps.map((x, xi) => (xi === i ? { ...x, word: e.target.value.toUpperCase() } : x)))
                            }
                            placeholder="WORD"
                            className="editor-input !h-8 !w-32 font-condensed uppercase"
                          />
                        </div>
                        <input
                          value={p.a}
                          onChange={(e) => setPairs((ps) => ps.map((x, xi) => (xi === i ? { ...x, a: e.target.value } : x)))}
                          placeholder="First meaning (3-6 words)"
                          className="editor-input mt-2"
                        />
                        <input
                          value={p.b}
                          onChange={(e) => setPairs((ps) => ps.map((x, xi) => (xi === i ? { ...x, b: e.target.value } : x)))}
                          placeholder="Second meaning (3-6 words)"
                          className="editor-input mt-2"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {sheetMode === "word" && (
                  <div>
                    <label className="small-caps block text-[10px] text-ink-secondary">
                      Today&apos;s five-letter answer
                    </label>
                    <input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
                      placeholder="STORM"
                      className="editor-input mt-1 font-condensed text-2xl uppercase tracking-[0.3em]"
                    />
                  </div>
                )}

                {sheetMode === "mini" && (
                  <div>
                    <div className="mx-auto grid w-full max-w-[240px] grid-cols-5 gap-1">
                      {grid.map((row, r) =>
                        row.map((ch, c) =>
                          skeleton.rows[r][c] === "#" ? (
                            <div key={`${r},${c}`} className="aspect-square rounded bg-black" />
                          ) : (
                            <input
                              key={`${r},${c}`}
                              value={ch}
                              onChange={(e) => {
                                const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
                                setGrid((g) => g.map((rw, ri) => rw.map((cc, ci) => (ri === r && ci === c ? v : cc))));
                              }}
                              maxLength={2}
                              className="aspect-square rounded border border-border bg-surface text-center font-condensed text-lg font-semibold uppercase text-ink outline-none focus:border-ink"
                            />
                          )
                        )
                      )}
                    </div>
                    <div className="mt-4 grid gap-1.5">
                      {[...miniSlots.across.map((s) => ({ ...s, dir: "A" })), ...miniSlots.down.map((s) => ({ ...s, dir: "D" }))].map(
                        (s) => (
                          <div key={`${s.num}${s.dir}`} className="flex items-center gap-2">
                            <span className="w-8 shrink-0 font-condensed text-sm font-semibold text-ink-secondary">
                              {s.num}
                              {s.dir}
                            </span>
                            <input
                              value={clues[`${s.num}${s.dir}`] ?? ""}
                              onChange={(e) => setClues((c) => ({ ...c, [`${s.num}${s.dir}`]: e.target.value }))}
                              placeholder={`Clue for ${Array.from({ length: s.len }, (_, i) =>
                                s.dir === "A" ? grid[s.row][s.col + i] || "·" : grid[s.row + i][s.col] || "·"
                              ).join("")}`}
                              className="editor-input !h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-secondary">Copy the prompt, paste the model&apos;s JSON.</p>
                  <Button variant="ghost" size="sm" onClick={() => void copyPrompt()}>
                    {copied ? "Copied" : "Copy prompt"}
                  </Button>
                </div>
                <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-[11px] leading-relaxed text-ink-secondary">
                  {promptFor(sheetMode, skeleton)}
                </pre>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  rows={5}
                  placeholder="{ … }"
                  className="mt-3 w-full resize-y rounded-xl border border-border bg-surface p-3 font-mono text-xs outline-none focus:border-ink"
                />
              </div>
            )}

            {error && <p className="mt-2 text-xs font-semibold text-wrong">{error}</p>}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <Button variant="ghost" onClick={() => setSheetMode(null)}>
                Cancel
              </Button>
              <Button onClick={() => void save()} disabled={busy || (tab === "ai" && !aiText.trim())}>
                {busy ? "Saving…" : "Validate & Save"}
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </section>
  );
}
