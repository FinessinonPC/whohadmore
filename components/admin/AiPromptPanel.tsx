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

const PROMPT = `You are planning a daily higher/lower trivia game. The game shows players two cards side by side and they must pick which has the higher statistic. Generate a complete game in the following JSON format. Return ONLY the JSON, no explanation.

Topic should be specific, timely, and interesting — ideally tied to current events, recent sports, pop culture, or surprising facts. The stat should be something most people have rough intuition about but will still be surprised by the exact number. Avoid topics where the order is too obvious.

Return this exact structure:
{
  "topic_label": "string",
  "topic_category": "sports|geography|entertainment|science|current_events",
  "stat_label": "string",
  "stat_unit": "string",
  "cards": [
    { "entity_name": "string", "stat_value": number }
    // 15 total
  ]
}

Make the values accurate. Order the cards randomly, not by value. Pick entities that have good Wikipedia pages so images will auto-populate.`;

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
