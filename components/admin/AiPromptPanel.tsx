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

const PROMPT = `You are the creative director for a daily higher/lower game. Players see two cards and tap whichever has the higher value of one stat. Invent ONE genuinely ORIGINAL game - the kind that makes someone say "huh, I never thought to compare those."

THREE rules that matter most:

1) NOVEL. Pick a comparison nobody has seen in a trivia game. Push past the obvious.
   HARD-AVOID (overdone): NBA/NFL stats, country populations, land area, net worth,
   tallest buildings, longest rivers, box office, Spotify streams, YouTube subs.

2) OBJECTIVE - exactly one right answer, not debatable. Use a hard, measurable,
   verifiable NUMBER (count, length, weight, speed, year, calories, etc.). NO
   opinions, rankings, "best/greatest", quality scores, or anything subjective.
   For any two cards, which is higher must be a settled fact.

3) NON-CONTROVERSIAL & light. Keep it fun and safe. AVOID death tolls, war
   casualties, disasters, crime, disease, politics, religion, and anything grim
   or divisive. Aim for playful, everyday, surprising.

4) EDUCATED-GUESSABLE. Most people should have a rough intuition and be able to
   reason about it - but very few will know the exact order. Include real upsets.

Good directions: hidden everyday numbers (water to grow foods, caffeine in drinks,
ingredients in a recipe, weight of animals/objects), surprising "per X" stats
(coffee per capita, escalator length, Lego pieces in sets), counterintuitive
science (animal top speeds, gestation lengths, planet day-lengths, boiling points),
fun culture trivia (episode counts of shows, runtime of films, words in a song).

Build it well:
- 16 entities, real and verifiable, ACCURATE values, all the SAME unit/scale.
- Order the cards RANDOMLY (not sorted by value).
- Use exact Wikipedia article titles as entity_name so images auto-populate.

Return ONLY this JSON - no explanation, no markdown fences:
{
  "topic_label": "string",        // specific & intriguing
  "topic_category": "sports|geography|entertainment|science|current_events",
  "stat_label": "string",
  "stat_unit": "string",
  "cards": [
    { "entity_name": "string", "stat_value": number }
    // 16 total
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
      /* clipboard blocked - the prompt is visible to copy manually */
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
