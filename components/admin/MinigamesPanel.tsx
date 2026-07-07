"use client";

import { useCallback, useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/adminClient";
import { validateMinigame, type MinigameMode } from "@/lib/minigameSchemas";

const MODE_META: { id: MinigameMode; name: string; accent: string; blurb: string }[] = [
  { id: "duality", name: "Duality", accent: "#06B6D4", blurb: "Two categories, 8 items to sort" },
  { id: "word", name: "Word", accent: "#FFC400", blurb: "The daily five-letter answer" },
  { id: "mini", name: "Mini", accent: "#2E6BFF", blurb: "5x5 crossword grid + clues" },
];

const PROMPTS: Record<MinigameMode, string> = {
  duality: `Create ONE round of "Duality" - a daily sorting game. Players see two category names and eight items one at a time; they tap which category each item belongs to.

Rules that matter:
1) The two categories must be a FUN, surprising pairing where items genuinely confuse (e.g. "Harry Potter spell" vs "IKEA product", "Pasta shape" vs "Italian city").
2) EXACTLY 8 items: EXACTLY 4 with side "L" (the left category) and 4 with side "R".
3) Every item belongs UNAMBIGUOUSLY to exactly one side - no items that could be both.
4) Mix the order so sides alternate unpredictably.
5) Keep it light and safe - no politics, religion, tragedy.
6) Add a short fun "note" to 3-4 items (a payoff fact shown after answering).

Return ONLY this JSON, no markdown fences:
{
  "left": "Category A name",
  "right": "Category B name",
  "items": [
    { "text": "Item", "side": "L", "note": "optional fun fact" }
    // 8 total, exactly 4 L and 4 R
  ]
}`,
  word: `Pick ONE five-letter English word for a daily Wordle-style game.

Rules:
1) Exactly 5 letters, a COMMON word every adult knows (no obscure words, no proper nouns, no plurals ending in S).
2) Fun to discover - concrete nouns and vivid words beat filler words.

Return ONLY this JSON, no markdown fences:
{ "answer": "WORDX" }`,
  mini: `Create ONE 5x5 mini crossword. You MUST use EXACTLY this black-square layout ('#' = black, letters elsewhere):

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
2) Double-check every DOWN word letter-by-letter against your grid before answering - a single wrong crossing invalidates the puzzle.
3) Clues: short, fair, NYT-Monday easy. A touch of wit welcome.

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

/**
 * Admin panel for the three pack games on a given date. Each game shows
 * whether the day runs on CUSTOM content or the AUTO pack rotation, with the
 * same copy-prompt / paste-JSON AI flow as the chain game. Pasted content is
 * validated hard (Mini grids are re-verified letter by letter) before saving.
 */
export function MinigamesPanel({ date }: { date: string }) {
  const [custom, setCustom] = useState<Record<string, unknown>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<MinigameMode | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/minigame?date=${date}`);
      const data = (await res.json()) as { custom?: Record<string, unknown>; error?: string; detail?: string };
      setCustom(data.custom ?? {});
      setNotice(
        data.error === "query_failed"
          ? "daily_minigames table not found - run supabase/migrations/0003_daily_minigames.sql, then custom days will save."
          : null
      );
    } catch {
      setCustom({});
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function save() {
    if (!sheetMode) return;
    const raw = extractJson(text);
    if (!raw) {
      setError("Couldn't parse that. Paste the raw JSON the model returned.");
      return;
    }
    const v = validateMinigame(sheetMode, raw);
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
      setText("");
      setError(null);
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

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface/50 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold text-ink">The other daily games</h2>
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
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: m.accent }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-ink">{m.name}</span>
                <span className="block truncate text-xs text-ink-secondary">{m.blurb}</span>
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
              {isCustom && (
                <button
                  onClick={() => void clear(m.id)}
                  className="shrink-0 text-xs font-semibold text-ink-secondary hover:text-wrong"
                >
                  Remove
                </button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  setSheetMode(m.id);
                  setText("");
                  setError(null);
                }}
              >
                {isCustom ? "Replace" : "Generate with AI"}
              </Button>
            </div>
          );
        })}
      </div>

      <Sheet open={sheetMode !== null} onClose={() => setSheetMode(null)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">
            {sheetMode && MODE_META.find((m) => m.id === sheetMode)?.name} · {date}
          </h2>
          <Button variant="ghost" size="sm" onClick={copyPrompt}>
            {copied ? "Copied" : "Copy prompt"}
          </Button>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          Copy this into your favorite model, then paste its JSON back here. Everything is
          validated hard before saving{sheetMode === "mini" ? " - bad crossings are rejected with the exact reason" : ""}.
        </p>

        {sheetMode && (
          <pre className="mt-4 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-[11px] leading-relaxed text-ink-secondary">
            {PROMPTS[sheetMode]}
          </pre>
        )}

        <label className="mt-5 block small-caps text-[10px] text-ink-secondary">
          Paste AI response here
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder='{ … }'
          className="mt-1 w-full resize-y rounded-xl border border-border bg-surface p-3 font-mono text-xs outline-none focus:border-ink"
        />
        {error && <p className="mt-1 text-xs font-semibold text-wrong">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Button variant="ghost" onClick={() => setSheetMode(null)}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={!text.trim() || busy}>
            {busy ? "Saving…" : "Validate & Save"}
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
