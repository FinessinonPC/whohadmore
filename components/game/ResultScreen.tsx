"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/Logo";
import { CountUp } from "./CountUp";
import { Confetti } from "./Confetti";
import { ChainTimeline } from "./ChainTimeline";
import { LivesDisplay } from "./LivesDisplay";
import { useProfile } from "@/hooks/useProfile";
import { formatDisplayDate, isToday } from "@/lib/date";

interface ResultScreenProps {
  reached: number;
  rounds: number;
  lives: number;
  timeSeconds: number;
  wrongRounds: number[];
  xpEarned: number;
  topicLabel: string;
  date: string;
  gameNumber: number;
  mode: "play" | "preview";
  alreadyPlayed?: boolean;
  onPlayAgain?: () => void;
  onClose?: () => void;
  onReset?: () => void;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function headline(reached: number, rounds: number, lives: number): string {
  if (reached >= rounds && lives >= 3) return "Flawless run.";
  if (reached >= rounds) return "You went the distance.";
  if (reached >= Math.ceil(rounds * 0.66)) return "So close.";
  if (reached === 0) return "Tough start.";
  return "Out of lives.";
}

export function ResultScreen({
  reached,
  rounds,
  lives,
  timeSeconds,
  wrongRounds,
  xpEarned,
  topicLabel,
  date,
  gameNumber,
  mode,
  alreadyPlayed = false,
  onPlayAgain,
  onClose,
  onReset,
}: ResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const daily = isToday(date);
  const clearedChain = mode === "play" && !alreadyPlayed && rounds > 0 && reached >= rounds;

  async function share() {
    const text = `WhoHadMore No. ${gameNumber} — ${topicLabel}\nMade it to ${reached}/${rounds} · +${xpEarned} XP · ${formatClock(
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
      {clearedChain && <Confetti />}

      {mode === "play" && (
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5">
            <BrandMark className="h-5 w-5" />
            <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/leaderboard" className="text-xs font-semibold text-ink-secondary transition-colors hover:text-ink">
              Leaderboard
            </Link>
            <Link href="/archive" className="text-xs font-semibold text-ink-secondary transition-colors hover:text-ink">
              Archive
            </Link>
          </nav>
        </header>
      )}

      <motion.div
        className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-6 text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        <p className="small-caps text-[11px] text-ink-secondary">
          {formatDisplayDate(date)} · {mode === "preview" ? "Preview" : `Game No. ${gameNumber}`}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">{topicLabel}</p>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
          {headline(reached, rounds, lives)}
        </h2>

        {/* Hero: how far you made it */}
        <div className="mt-5 flex items-baseline gap-1">
          <span className="font-condensed text-[5rem] font-bold leading-none text-ink">{reached}</span>
          <span className="font-condensed text-3xl font-bold text-ink-secondary">/ {rounds}</span>
        </div>
        <p className="small-caps mt-1 text-[11px] text-ink-secondary">rounds reached</p>

        {/* Frozen run timeline */}
        <div className="mt-4 w-full">
          <ChainTimeline position={reached} total={rounds} wrongRounds={wrongRounds} />
        </div>

        {/* XP earned */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-correct/30 bg-correct/10 px-4 py-2">
          <span className="font-condensed text-xl font-bold text-correct">
            +<CountUp value={xpEarned} run duration={1} /> XP
          </span>
          <span className="text-xs font-semibold text-correct/80">earned</span>
        </div>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-xs text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <LivesDisplay lives={lives} size="sm" />
          </span>
          <span className="tabular">⏱ {formatClock(timeSeconds)}</span>
        </div>

        {/* Actions */}
        {mode === "preview" ? (
          <div className="mt-7 flex w-full flex-col gap-2.5">
            <Button size="lg" onClick={onPlayAgain} className="w-full">
              Play again
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Close preview
            </Button>
          </div>
        ) : (
          <div className="mt-7 flex w-full flex-col gap-3">
            <ClaimBlock />

            {/* Push to the archive */}
            <Link href="/archive" className="contents">
              <button className="flex w-full items-center justify-between rounded-2xl bg-cta px-5 py-4 text-left text-white transition-colors hover:bg-black">
                <span>
                  <span className="block text-[15px] font-bold">Play more games</span>
                  <span className="block text-xs text-white/70">Jump into the archive — every past game is playable</span>
                </span>
                <span className="text-xl">→</span>
              </button>
            </Link>

            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="secondary" onClick={share}>
                {copied ? "Copied" : "Share"}
              </Button>
              <Link href="/leaderboard" className="contents">
                <Button variant="secondary" className="w-full">
                  Leaderboard
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-ink-secondary">
              {daily ? "A new game drops at midnight." : "Playing the archive."}
            </p>

            {onReset && (
              <button
                onClick={onReset}
                className="mx-auto text-xs font-semibold text-ink-secondary underline underline-offset-2 transition-colors hover:text-ink"
              >
                Reset &amp; replay (testing)
              </button>
            )}
          </div>
        )}
      </motion.div>
    </main>
  );
}

/** Inline username signup / signed-in state for the result screen. */
function ClaimBlock() {
  const { profile, loading, claim } = useProfile();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return <div className="h-[92px] animate-pulse rounded-2xl bg-surface" />;
  }

  if (profile?.username) {
    return (
      <div className="rounded-2xl border border-correct/30 bg-correct/5 px-4 py-3 text-center">
        <p className="text-sm text-ink">
          Signed in as <span className="font-extrabold">{profile.username}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-secondary">XP added to your total — keep your streak going.</p>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await claim(username.trim());
    setSaving(false);
    if (!res.ok) setError(res.error ?? "Couldn't save that.");
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="text-[15px] font-bold text-ink">Save your progress</p>
      <p className="mt-0.5 text-xs text-ink-secondary">
        Pick a username to bank your XP, build a streak, and climb the leaderboard.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && username.trim() && save()}
          placeholder="Username"
          maxLength={20}
          className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-ink"
        />
        <Button onClick={save} disabled={saving || !username.trim()}>
          {saving ? "…" : "Save"}
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-wrong">{error}</p>}
    </div>
  );
}
