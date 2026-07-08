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
import type { DualityDay, MiniDay } from "@/lib/contentPacks";

const MODE_META: { id: MinigameMode; accent: string; blurb: string }[] = [
  { id: "duality", accent: "#06B6D4", blurb: "8 definitions, 4 hidden pairs" },
  { id: "word", accent: "#FFC400", blurb: "The daily five-letter answer" },
  { id: "mini", accent: "#2E6BFF", blurb: "5x5 crossword grid + clues" },
];

// The fixed corner-cut layout every Mini uses (matches packs + the AI prompt).
const MINI_TEMPLATE = ["AAA##", "AAAA#", "AAAAA", "#AAAA", "##AAA"];

const PROMPTS: Record<MinigameMode, string> = {
  duality: `You are a puzzle editor at the level of the NYT Games desk, writing today's "Duality" - a daily pairing game with a devoted audience. Players see EIGHT short definitions, shuffled. Hidden among them are FOUR PAIRS: each pair is two definitions of the SAME word with two unrelated meanings ("Place that holds your money" + "The side of a river" = BANK). Players tap two that go together; matches reveal the word.

Editorial bar (what makes a great day):
1) The aha. Every pair should produce a small delight when the word reveals - the second meaning should feel obvious IN HINDSIGHT, never contrived. If you have to squint, cut it.
2) Fair. Both definitions are unmistakably correct for the word, and NO definition could plausibly describe a different pair's word. One clean answer, always.
3) Tight writing. Definitions are 3-6 words, concrete, and evocative - written like crossword clues, not dictionary entries. Never include the answer word (or any form of it) in a definition.
4) A real difficulty curve. Pair 1 lands in two seconds; pair 4 makes a smart player pause. Difficulty comes from the LESS-FAMOUS second meaning, not from obscure words.
5) Everyday words only - the kind everyone knows in BOTH senses once revealed. Light and safe: no politics, religion, or tragedy.
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
  mini: `You are a crossword constructor for a daily mini with NYT-Mini standards: a clean fill of everyday words and clues with a wink. Create ONE 5x5 mini crossword. You MUST use EXACTLY this black-square layout ('#' = black, letters elsewhere):

Row 1: letters at columns 1-3, '#' at columns 4-5   -> "ABC##"
Row 2: letters at columns 1-4, '#' at column 5      -> "ABCD#"
Row 3: letters at all 5 columns                     -> "ABCDE"
Row 4: '#' at column 1, letters at columns 2-5      -> "#ABCD"
Row 5: '#' at columns 1-2, letters at columns 3-5   -> "##ABC"

The slots are FIXED (0-indexed row/col):
ACROSS: 1A row0 col0 len3 · 4A row1 col0 len4 · 6A row2 col0 len5 · 8A row3 col1 len4 · 9A row4 col2 len3
DOWN:   1D row0 col0 len3 · 2D row0 col1 len4 · 3D row0 col2 len5 · 5D row1 col3 len4 · 7D row2 col4 len3

Hard rules:
1) EVERY across AND down entry must be a real, common English word (no abbreviations, no proper nouns, no obscure crossword-ese). The 10 words must all be different.
2) Double-check every DOWN word letter-by-letter against your grid before answering - a single wrong crossing invalidates the puzzle. Write the grid out, then verify each column spells its down answer.
3) Clues read like a good Monday: short, fair, and warm - a small smile beats a groan. Clue the MEANING players know best; misdirection is welcome only if the answer still feels fair.
4) Prefer lively fill (OCEAN, TANGO, CRISP) over flat glue words when the grid allows.

Return ONLY this JSON, no markdown fences (rows use UPPERCASE letters and '#'):
{
  "rows": ["...", "...", "...", "...", "..."],
  "across": [
    { "num": 1, "row": 0, "col": 0, "len": 3, "clue": "...", "answer": "..." },
    { "num": 4, "row": 1, "col": 0, "len": 4, "clue": "...", "answer": "..." },
    { "num": 6, "row": 2, "col": 0, "len": 5, "clue": "...", "answer": "..." },
    { "num": 8, "row": 3, "col": 1, "len": 4, "clue": "...", "answer": "..." },
    { "num": 9, "row": 4, "col": 2, "len": 3, "clue": "...", "answer": "..." }
  ],
  "down": [
    { "num": 1, "row": 0, "col": 0, "len": 3, "clue": "...", "answer": "..." },
    { "num": 2, "row": 0, "col": 1, "len": 4, "clue": "...", "answer": "..." },
    { "num": 3, "row": 0, "col": 2, "len": 5, "clue": "...", "answer": "..." },
    { "num": 5, "row": 1, "col": 3, "len": 4, "clue": "...", "answer": "..." },
    { "num": 7, "row": 2, "col": 4, "len": 3, "clue": "...", "answer": "..." }
  ]
}`,
};

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
  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: 5 }, () => Array(5).fill(""))
  );
  const [clues, setClues] = useState<Record<string, string>>({});

  const miniSlots = useMemo(() => deriveMiniSlots(MINI_TEMPLATE), []);

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
      const matchesTemplate =
        m &&
        m.rows.every((row, r) =>
          row.split("").every((ch, c) => (ch === "#") === (MINI_TEMPLATE[r][c] === "#"))
        );
      setGrid(
        Array.from({ length: 5 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) =>
            MINI_TEMPLATE[r][c] === "#" ? "#" : matchesTemplate ? m!.rows[r][c] : ""
          )
        )
      );
      const cl: Record<string, string> = {};
      if (matchesTemplate && m) {
        for (const s of m.across) cl[`${s.num}A`] = s.clue;
        for (const s of m.down) cl[`${s.num}D`] = s.clue;
      }
      setClues(cl);
    }
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
      await navigator.clipboard.writeText(PROMPTS[sheetMode]);
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
                          MINI_TEMPLATE[r][c] === "#" ? (
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
                  {PROMPTS[sheetMode]}
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
