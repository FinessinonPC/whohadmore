"use client";

import { useState, useMemo } from "react";
import { trackEvent } from "@/lib/clientTrack";
import { LIVE_MODES } from "@/lib/modes";
import { formatDisplayDate } from "@/lib/date";
import { getLocalResult } from "@/lib/playStore";
import { buildShareText } from "@/lib/shareText";
import { useArchiveScores } from "@/hooks/useArchiveScores";
import { useDailyStanding } from "@/hooks/useDailyStanding";

/**
 * A shareable, spoiler-free post that links back to the site.
 *
 * Topic, the run as coloured blocks, the total, and the share of players it
 * beat. No per-game breakdown - a table of four names and four numbers is not
 * something anyone reads in a group chat. See lib/shareText.
 */
function shareText(
  date: string,
  scoreFor: ReturnType<typeof useArchiveScores>,
  beatPct: number | null
): string {
  const chain = getLocalResult(date);
  const total = LIVE_MODES.reduce((a, m) => a + scoreFor(date, m.id).points, 0);
  return buildShareText({
    dateLabel: formatDisplayDate(date),
    chain: chain
      ? {
          reached: chain.reached,
          rounds: chain.rounds,
          wrongRounds: chain.wrongRounds ?? [],
          topic: chain.topic,
        }
      : null,
    total,
    beatPct,
    origin:
      typeof window !== "undefined"
        ? window.location.origin.replace(/^https?:\/\//, "")
        : "www.whohadmore.com",
  });
}

function ShareGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 15 V4" />
      <path d="M8 7.5 L12 3.5 L16 7.5" />
      <path d="M5 12 V20 H19 V12" />
    </svg>
  );
}

interface ShareResultsProps {
  date: string;
  className?: string;
  /** "bar" = the full CTA button; "icon" = a compact corner share button. */
  variant?: "bar" | "icon";
  /** Analytics context: where the tap came from (hub, game_end, results_modal…). */
  surface?: string;
  /** Analytics context: which game, for the per-game buttons. */
  game?: string;
}

/**
 * Share-your-scores control. Uses the native share sheet on mobile (the growth
 * loop) and falls back to copying the scorecard to the clipboard elsewhere.
 * Every tap fires a `share_click` event so we can measure how much sharing the
 * various surfaces actually drive.
 */
export function ShareResults({ date, className, variant = "bar", surface = "card", game }: ShareResultsProps) {
  const [copied, setCopied] = useState(false);
  const dates = useMemo(() => [{ play_date: date }], [date]);
  const scoreFor = useArchiveScores(dates);
  // Same source the card-complete pop-up reads, so the post and the screen
  // behind it can never quote different figures.
  const standing = useDailyStanding(date);

  async function share() {
    const text = shareText(date, scoreFor, standing?.beatPct ?? null);
    trackEvent("share_click", { surface, game: game ?? "all", date });
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

  if (variant === "icon") {
    return (
      <button
        onClick={share}
        aria-label="Share result"
        title={copied ? "Copied" : "Share result"}
        className={`wonky ink-shadow-sm inline-flex h-10 w-10 items-center justify-center border-2 border-ink bg-surface text-ink transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
          className ?? ""
        }`}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
            <path d="M5 12.5 L10 17.5 L19 6.5" />
          </svg>
        ) : (
          <ShareGlyph className="h-[18px] w-[18px]" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={share}
      className={
        className ??
        "ink-shadow-sm flex h-14 w-full items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-cta text-base font-bold text-background transition-all hover:opacity-95 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
      }
    >
      {copied ? (
        "Copied to clipboard"
      ) : (
        <>
          <ShareGlyph className="h-[18px] w-[18px]" />
          Share your scores
        </>
      )}
    </button>
  );
}
