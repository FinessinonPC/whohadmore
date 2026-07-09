"use client";

import { useState, useMemo } from "react";
import { LIVE_MODES } from "@/lib/modes";
import { formatDisplayDate } from "@/lib/date";
import { useArchiveScores } from "@/hooks/useArchiveScores";

/**
 * A shareable, spoiler-free scorecard that links back to the site. Scores come
 * from the same device+server merge the hub uses, so a signed-in player's total
 * is correct even when this device's localStorage is empty.
 */
function shareText(date: string, scoreFor: ReturnType<typeof useArchiveScores>): string {
  const lines = LIVE_MODES.map((m) => {
    const s = scoreFor(date, m.id);
    return { name: m.name, score: s.points, played: s.played };
  });
  const total = lines.reduce((a, l) => a + l.score, 0);
  const max = LIVE_MODES.length * 1000;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin.replace(/^https?:\/\//, "")
      : "whohadmore.com";
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
  const dates = useMemo(() => [{ play_date: date }], [date]);
  const scoreFor = useArchiveScores(dates);

  async function share() {
    const text = shareText(date, scoreFor);
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
