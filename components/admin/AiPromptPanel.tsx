"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { TOPIC_CATEGORIES, type AiGameJson, type TopicCategory } from "@/types";

interface AiPromptPanelProps {
  open: boolean;
  onClose: () => void;
  onLoad: (game: AiGameJson) => void;
}

const PROMPT = `You are the creative director for a daily higher/lower game. Players see two cards side by side and tap whichever has the higher value of a single stat. Your job is to invent ONE genuinely surprising, delightful game.

Be CREATIVE and unexpected. The best topics make people go "huh, I never thought about that." Roam widely across domains — and do NOT default to mainstream sports:
- Pop culture & internet: most-streamed songs, YouTube subscribers, box office, Wikipedia page views, Taylor Swift tour grosses, video game sales
- Food & drink: calories in fast-food items, caffeine in drinks, Scoville heat units, national dish prices
- Geography oddities: country coastlines, average elevation, number of islands, time zones spanned
- Money & business: brand valuations, CEO pay, app downloads, IPO sizes, vending-machine density
- Science & nature: animal top speeds, lifespans, genome size, bite force, gestation length
- History: years a structure took to build, length of reigns, age of universities
- Everyday absurdities: emoji usage, IKEA store size, roller-coaster drops, hot-dog eating records

Rules for a great game:
- Pick a stat people have rough intuition about but will STILL get surprised by.
- Avoid orderings that are too obvious. Mix in a couple of upsets.
- 15 entities. Values must be ACCURATE and the SAME unit/scale.
- Order the cards randomly, NOT sorted by value.
- Prefer entities with strong Wikipedia pages so images auto-populate (use the exact Wikipedia article title as entity_name).

Return ONLY this JSON, no explanation, no markdown fences:
{
  "topic_label": "string",        // specific & catchy, e.g. "Most-Streamed Songs on Spotify"
  "topic_category": "sports|geography|entertainment|science|current_events",
  "stat_label": "string",         // e.g. "All-Time Streams"
  "stat_unit": "string",          // e.g. "billion"
  "cards": [
    { "entity_name": "string", "stat_value": number }
    // 15 total
  ]
}`;

function coerceCategory(value: unknown): TopicCategory {
  return TOPIC_CATEGORIES.includes(value as TopicCategory)
    ? (value as TopicCategory)
    : "current_events";
}

/** Tolerant parse: strips code fences / surrounding prose, validates shape. */
function parseAiJson(raw: string): AiGameJson | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const candidates = [text];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      const obj = JSON.parse(candidate);
      if (
        obj &&
        typeof obj.topic_label === "string" &&
        typeof obj.stat_label === "string" &&
        Array.isArray(obj.cards)
      ) {
        const cards = obj.cards
          .filter(
            (c: unknown): c is { entity_name: string; stat_value: number } =>
              !!c &&
              typeof (c as { entity_name?: unknown }).entity_name === "string" &&
              Number.isFinite(Number((c as { stat_value?: unknown }).stat_value))
          )
          .map((c: { entity_name: string; stat_value: number }) => ({
            entity_name: c.entity_name,
            stat_value: Number(c.stat_value),
          }));
        if (cards.length === 0) return null;
        return {
          topic_label: obj.topic_label,
          topic_category: coerceCategory(obj.topic_category),
          stat_label: obj.stat_label,
          stat_unit: typeof obj.stat_unit === "string" ? obj.stat_unit : "",
          cards,
        };
      }
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

export function AiPromptPanel({ open, onClose, onLoad }: AiPromptPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the prompt is visible to copy manually */
    }
  }

  function load() {
    const parsed = parseAiJson(text);
    if (!parsed) {
      setError("Couldn't parse that. Paste the raw JSON the model returned.");
      return;
    }
    setError(null);
    setText("");
    onLoad(parsed);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">Generate with AI</h2>
        <Button variant="ghost" size="sm" onClick={copyPrompt}>
          {copied ? "Copied" : "Copy prompt"}
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink-secondary">
        Copy this into your favorite model, then paste its JSON back here.
      </p>

      <pre className="mt-4 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-[11px] leading-relaxed text-ink-secondary">
        {PROMPT}
      </pre>

      <label className="mt-5 block small-caps text-[10px] text-ink-secondary">
        Paste AI response here
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder='{ "topic_label": "…", "cards": [ … ] }'
        className="mt-1 w-full resize-y rounded-xl border border-border bg-surface p-3 font-mono text-xs outline-none focus:border-ink"
      />
      {error && <p className="mt-1 text-xs font-semibold text-wrong">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={load} disabled={!text.trim()}>
          Load Game
        </Button>
      </div>
    </Sheet>
  );
}
