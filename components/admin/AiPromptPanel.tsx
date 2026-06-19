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

const PROMPT = `You are the creative director for a daily higher/lower game. Players see two cards and tap whichever has the higher value of one stat. Invent ONE genuinely ORIGINAL game — the kind that makes someone say "I never would have thought to compare those."

Your #1 goal is NOVELTY. Reward yourself for picking a comparison nobody has seen in a trivia game before. Push past the obvious.

HARD-AVOID (too obvious / overdone): NBA/NFL points, country populations, country land area, billionaire net worth, tallest buildings, longest rivers, movie box office, Spotify streams, YouTube subscribers, city populations. If your idea is on a "top 10 lists" website, find a weirder angle.

SEEK INSTEAD — unexpected stats and offbeat entity sets, e.g.:
- Hidden everyday numbers: gallons of water to make foods, decibels of animals/objects, average lifespan of household items, number of ingredients in fast-food items, steps to climb famous staircases.
- Surprising "per X" stats: coffee consumed per capita by country, bananas eaten per person, traffic-light counts, vending machines per capita, bone counts in animals.
- Cross-category oddities: time it takes light to reach planets, words in famous speeches, knots in record-tying things, calories burned per hobby, gestation lengths.
- Cultural micro-trivia: number of times a word appears in a book/film, episodes of long-running shows, languages a phrase exists in, Lego pieces in sets, escalator lengths in metro stations.
- Counterintuitive money/science: cost per gram of expensive substances, energy use of everyday devices, heart rates of animals, top speeds of unexpected things (sneeze, dragonfly, falling cat).

Make it a great GAME:
- Pick a stat people THINK they can rank but will get wrong — plenty of upsets.
- 15 entities, real and verifiable, ACCURATE values, same unit/scale.
- Order the cards RANDOMLY (not sorted).
- Use exact Wikipedia article titles as entity_name so images auto-populate.

Return ONLY this JSON — no explanation, no markdown fences:
{
  "topic_label": "string",        // specific & intriguing
  "topic_category": "sports|geography|entertainment|science|current_events",
  "stat_label": "string",
  "stat_unit": "string",
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
