"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandLockup } from "@/components/ui/Logo";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { NextGameCTA } from "@/components/games/GameShell";
import { ChainTimeline } from "./ChainTimeline";
import { Confetti } from "./Confetti";
import { Fireworks } from "./Fireworks";
import { modeDef } from "@/lib/modes";
import { isJuly4th } from "@/lib/festive";

interface ResultScreenProps {
  reached: number;
  rounds: number;
  lives: number;
  wrongRounds: number[];
  date: string;
  mode: "play" | "preview";
  alreadyPlayed?: boolean;
  onPlayAgain?: () => void;
  onClose?: () => void;
  // Accepted for compatibility with earlier callers; no longer shown - the end
  // screen is intentionally minimal now (just how far you made it).
  timeSeconds?: number;
  xpEarned?: number;
  topicLabel?: string;
  gameNumber?: number;
  levelUp?: number | null;
  streak?: number | null;
  newAchievements?: string[];
}

function headline(reached: number, rounds: number, lives: number): string {
  if (reached >= rounds && lives >= 3) return "Flawless run.";
  if (reached >= rounds) return "You went the distance.";
  if (reached >= Math.ceil(rounds * 0.66)) return "So close.";
  if (reached === 0) return "Tough start.";
  return "Out of lives.";
}

/**
 * Chain's end state, rebuilt to match the other games: the same brand header,
 * a single "how far you made it" line, and the Next up hand-off that pulls you
 * straight into the rest of today's games. No leaderboard, percentile, XP, or
 * SEO - the score lives in the combined daily total, not here.
 */
export function ResultScreen({
  reached,
  rounds,
  lives,
  wrongRounds,
  date,
  mode,
  onPlayAgain,
  onClose,
}: ResultScreenProps) {
  const cleared = rounds > 0 && reached >= rounds;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5">
      {cleared && <Confetti />}
      {isJuly4th(date) && <Fireworks />}

      <header className="relative z-[46] flex items-center justify-between">
        {mode === "preview" ? (
          <BrandLockup />
        ) : (
          <Link href="/" aria-label="Back to today's games">
            <BrandLockup />
          </Link>
        )}
        <span style={{ color: modeDef("chain").accent }}>
          <GameWordmark mode="chain" className="text-xl" />
        </span>
      </header>

      <motion.div
        className="relative z-[46] flex flex-1 flex-col items-center justify-center py-6 text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        <h2 className="font-condensed text-3xl font-semibold uppercase tracking-wide text-ink">
          {headline(reached, rounds, lives)}
        </h2>

        {/* How far you made it - the whole story */}
        <div className="mt-4">
          <span className="font-condensed text-[5.5rem] font-bold leading-none text-ink tabular">
            {reached}
            <span className="text-ink-secondary">/{rounds}</span>
          </span>
        </div>
        <p className="small-caps mt-1 text-[11px] text-ink-secondary">rounds reached</p>

        <div className="mt-6 w-full max-w-xs">
          <ChainTimeline position={reached} total={rounds} wrongRounds={wrongRounds} />
        </div>
      </motion.div>

      {/* Hand off to the next game (or restart the preview) */}
      <div className="relative z-[46] mx-auto w-full max-w-xs pb-1">
        {mode === "preview" ? (
          <div className="flex flex-col gap-2.5">
            <Button size="lg" onClick={onPlayAgain} className="w-full">
              Play again
            </Button>
            <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
              Close preview
            </Button>
          </div>
        ) : (
          <NextGameCTA date={date} current="chain" />
        )}
      </div>
    </main>
  );
}
