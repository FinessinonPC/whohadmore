"use client";

import { useState } from "react";
import { getLocalResult } from "@/lib/playStore";
import { getModeResult } from "@/lib/modeStore";
import { chainDailyScore } from "@/lib/leaderboard";
import { LIVE_MODES } from "@/lib/modes";
import { formatDisplayDate } from "@/lib/date";

interface Line {
  name: string;
  score: number;
  played: boolean;
}

/** Today's per-game scores from local state (all games score 0–1000). */
function dayLines(date: string): Line[] {
  return LIVE_MODES.map((m) => {
    if (m.id === "chain") {
      const r = getLocalResult(date);
      return { name: m.name, score: r ? chainDailyScore(r.reached, r.rounds) : 0, played: Boolean(r) };
    }
    const res = getModeResult(m.id, date);
    return { name: m.name, score: res?.score ?? 0, played: Boolean(res) };
  });
}

/** A shareable, spoiler-free scorecard that links back to the site. */
export function buildShareText(date: string): string {
  const lines = dayLines(date);
  const total = lines.reduce((a, l) => a + l.score, 0);
  const max = LIVE_MODES.length * 1000;
  const origin = typeof window !== "undefined" ? window.location.origin.replace(/^https?:\/\//, "") : "whohadmore.com";
  const games = lines
    .filter((l) => l.played)
    .map((l) => `${l.name} ${l.score.toLocaleString()}`)
    .join(" · ");
  return [
    `WhoHadMore — ${formatDisplayDate(date)} 🎯`,
    games,
    `Total ${total.toLocaleString()} / ${max.toLocaleString()}`,
    origin,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Share-your-scores button. Uses the native share sheet on mobile (the growth
 * loop) and falls back to copying the scorecard to the clipboard elsewhere.
 */
export function ShareResults({ date, className }: { date: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = buildShareText(date);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "WhoHadMore", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed the share sheet - nothing to do */
    }
  }

  return (
    <button
      onClick={share}
      className={
        className ??
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cta text-base font-bold text-background transition-transform active:scale-[0.98]"
      }
    >
      {copied ? "Copied to clipboard" : "Share your scores"}
    </button>
  );
}
