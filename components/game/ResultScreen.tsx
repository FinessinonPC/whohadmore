"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/Logo";
import { LivesDisplay } from "./LivesDisplay";
import { formatDisplayDate, isToday } from "@/lib/date";

interface ResultScreenProps {
  score: number;
  best: number;
  lives: number;
  timeSeconds: number;
  topicLabel: string;
  date: string;
  gameNumber: number;
  mode: "play" | "preview";
  alreadyPlayed?: boolean;
  onPlayAgain?: () => void;
  onClose?: () => void;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function headline(score: number, best: number, lives: number, already: boolean): string {
  if (already) return "Already played.";
  if (score >= best && lives === 3) return "Flawless.";
  if (score >= best) return "You cleared the chain.";
  if (lives <= 0) return "Out of lives.";
  return "Nice run.";
}

export function ResultScreen({
  score,
  best,
  lives,
  timeSeconds,
  topicLabel,
  date,
  gameNumber,
  mode,
  alreadyPlayed = false,
  onPlayAgain,
  onClose,
}: ResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const daily = isToday(date);

  async function share() {
    const text = `WhoHadMore No. ${gameNumber} — ${topicLabel}\nScore ${score}/${best} · ${lives} lives left · ${formatClock(
      timeSeconds
    )}`;
    try {
      if (navigator.share) await navigator.share({ title: "WhoHadMore", text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5">
      {mode === "play" && (
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5">
            <BrandMark className="h-5 w-5" />
            <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
          </Link>
          <Link
            href="/archive"
            className="text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
          >
            Archive
          </Link>
        </header>
      )}

      <motion.div
        className="flex flex-1 flex-col items-center justify-center text-center"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        <p className="small-caps text-xs text-ink-secondary">
          {formatDisplayDate(date)} · {mode === "preview" ? "Preview" : `Game No. ${gameNumber}`}
        </p>
        <p className="mt-1 max-w-xs text-sm font-semibold text-ink">{topicLabel}</p>

        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
          {headline(score, best, lives, alreadyPlayed)}
        </h2>

        {/* Hero score */}
        <div className="mt-6 flex items-baseline gap-1">
          <span className="tabular text-display font-black leading-none text-ink">{score}</span>
          <span className="text-2xl font-bold text-ink-secondary">/{best}</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">correct in a row</p>

        {/* Stats */}
        <div className="mt-7 grid w-full max-w-xs grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4">
            <span className="small-caps text-[10px] text-ink-secondary">Lives</span>
            <LivesDisplay lives={lives} />
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-4">
            <span className="small-caps text-[10px] text-ink-secondary">Time</span>
            <span className="tabular text-lg font-bold text-ink">{formatClock(timeSeconds)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
          {mode === "preview" ? (
            <>
              <Button size="lg" onClick={onPlayAgain} className="w-full">
                Play again
              </Button>
              <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
                Close preview
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={share} className="w-full">
                {copied ? "Copied to clipboard" : "Share result"}
              </Button>
              <Link href="/archive" className="contents">
                <Button variant="secondary" size="lg" className="w-full">
                  Browse the archive
                </Button>
              </Link>
              <p className="mt-2 text-xs text-ink-secondary">
                {daily
                  ? "A new game drops at midnight. Sign in soon to keep your stats & streaks."
                  : "Sign in soon to review past games and track your stats."}
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
