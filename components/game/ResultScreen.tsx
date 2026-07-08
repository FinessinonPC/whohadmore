"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandLockup } from "@/components/ui/Logo";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { NextGameCTA } from "@/components/games/GameShell";
import { CountUp } from "./CountUp";
import { ChainTimeline } from "./ChainTimeline";
import { Confetti } from "./Confetti";
import { Fireworks } from "./Fireworks";
import { chainDailyScore } from "@/lib/leaderboard";
import { modeDef } from "@/lib/modes";
import { isJuly4th } from "@/lib/festive";

interface ResultScreenProps {
  /** How many the player got right (0..rounds). */
  reached: number;
  rounds: number;
  wrongRounds: number[];
  date: string;
  mode: "play" | "preview";
  alreadyPlayed?: boolean;
  onPlayAgain?: () => void;
  onClose?: () => void;
}

function headline(correct: number, rounds: number): string {
  if (rounds > 0 && correct >= rounds) return "Perfect run.";
  if (correct >= Math.ceil(rounds * 0.7)) return "Strong run.";
  if (correct >= Math.ceil(rounds * 0.4)) return "Not bad.";
  if (correct === 0) return "Tough one.";
  return "Nice try.";
}

/**
 * Chain's end state, minimal and matching the other games: brand header, the
 * points you scored (how many you got right), and the Next up hand-off into the
 * rest of today's games. No hearts, no leaderboard, no XP.
 */
export function ResultScreen({
  reached,
  rounds,
  wrongRounds,
  date,
  mode,
  onPlayAgain,
  onClose,
}: ResultScreenProps) {
  const points = chainDailyScore(reached, rounds);
  const perfect = rounds > 0 && reached >= rounds;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-5 pb-10 pt-5">
      {perfect && <Confetti />}
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
          {headline(reached, rounds)}
        </h2>

        {/* Your score, in points */}
        <div className="mt-3">
          <span className="font-condensed text-[5.5rem] font-bold leading-none text-ink tabular">
            <CountUp value={points} run duration={1.1} />
          </span>
        </div>
        <p className="small-caps mt-1 text-[11px] text-ink-secondary">points</p>
        <p className="mt-2 text-sm font-semibold text-ink">
          {reached} of {rounds} correct
        </p>

        <div className="mt-6 w-full max-w-xs">
          <ChainTimeline position={rounds} total={rounds} wrongRounds={wrongRounds} />
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
