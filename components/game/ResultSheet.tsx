"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { LivesDisplay } from "./LivesDisplay";
import { formatDisplayDate } from "@/lib/date";

interface ResultSheetProps {
  open: boolean;
  onClose: () => void;
  score: number;
  best: number;
  lives: number;
  timeSeconds: number;
  topicLabel: string;
  playDate: string;
  isArchive: boolean;
  onRestart: () => void;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function headline(score: number, best: number, lives: number): string {
  if (score >= best && lives === 3) return "Flawless.";
  if (score >= best) return "You cleared the chain.";
  if (lives <= 0) return "Out of lives.";
  return "Nice run.";
}

export function ResultSheet({
  open,
  onClose,
  score,
  best,
  lives,
  timeSeconds,
  topicLabel,
  playDate,
  isArchive,
  onRestart,
}: ResultSheetProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = `WhoHadMore — ${formatDisplayDate(playDate)}\n${topicLabel}\nScore ${score}/${best} · ${lives} lives left · ${formatClock(
      timeSeconds
    )}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "WhoHadMore", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <p className="small-caps text-xs text-ink-secondary">{topicLabel}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          {headline(score, best, lives)}
        </h2>

        {/* Hero score */}
        <div className="mt-6 flex items-baseline gap-1">
          <span className="tabular text-display font-black leading-none text-ink">
            {score}
          </span>
          <span className="text-2xl font-bold text-ink-secondary">/{best}</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">correct in a row</p>

        {/* Stats row */}
        <div className="mt-7 grid w-full grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4">
            <span className="small-caps text-[10px] text-ink-secondary">Lives</span>
            <LivesDisplay lives={lives} />
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-4">
            <span className="small-caps text-[10px] text-ink-secondary">Time</span>
            <span className="tabular text-lg font-bold text-ink">
              {formatClock(timeSeconds)}
            </span>
          </div>
        </div>

        {/* Leaderboards land later — see LeaderboardSheet + leaderboard_entries. */}
        <p className="mt-4 text-xs text-ink-secondary">
          Leaderboards & streaks coming soon.
        </p>

        {/* Actions */}
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Button size="lg" onClick={share} className="w-full">
            {copied ? "Copied to clipboard" : "Share result"}
          </Button>

          {isArchive ? (
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="secondary" size="lg" onClick={onRestart}>
                Play again
              </Button>
              <Link href="/play" className="contents">
                <Button variant="secondary" size="lg" className="w-full">
                  Today&apos;s game
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/archive" className="contents">
              <Button variant="secondary" size="lg" className="w-full">
                Browse the archive
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Sheet>
  );
}
