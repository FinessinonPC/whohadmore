"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
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
import { avoidAdjacentTies, formatStat } from "@/lib/gameLogic";
import { hashSeed, mulberry32, seededShuffle } from "@/lib/seed";
import { getSessionId } from "@/lib/playStore";
import type { GameCard } from "@/types";

interface ResultScreenProps {
  /** How many the player got right (0..rounds). */
  reached: number;
  rounds: number;
  wrongRounds: number[];
  date: string;
  mode: "play" | "preview";
  alreadyPlayed?: boolean;
  /** The day's cards - when present, the answers render ranked for admiring. */
  cards?: GameCard[];
  statUnit?: string | null;
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
  cards,
  statUnit,
  onPlayAgain,
  onClose,
}: ResultScreenProps) {
  const points = chainDailyScore(reached, rounds);
  const perfect = rounds > 0 && reached >= rounds;

  // The answers, ranked - the same 11 cards this player saw (identical seeded
  // shuffle to GameBoard's), sorted highest to lowest so the finished puzzle
  // can be admired. Client-only render, so getSessionId is safe here.
  const ranked = useMemo(() => {
    if (!cards || cards.length < 2) return [];
    const subset = avoidAdjacentTies(
      seededShuffle(cards, mulberry32(hashSeed(`${getSessionId()}:${date}`))).slice(0, 11)
    );
    return [...subset].sort((a, b) => b.stat_value - a.stat_value);
  }, [cards, date]);

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
        <span className="text-ink">
          <GameWordmark mode="chain" className="text-xl" alt={modeDef("chain").accent} />
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

        {/* Your score, inked onto the card */}
        <div className="relative mt-3">
          <span className="font-condensed text-[5.5rem] font-bold leading-none text-ink tabular">
            <CountUp value={points} run duration={1.1} />
          </span>
          {perfect && (
            <svg viewBox="0 0 100 100" className="absolute -right-9 -top-2 h-10 w-10 rotate-12" aria-hidden>
              <path
                d="M 50 8 L 61 36 L 92 38 L 68 58 L 76 90 L 50 71 L 24 90 L 32 58 L 8 38 L 39 36 Z"
                fill="#FFB300"
                stroke="#16181D"
                strokeWidth="6"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <p className="small-caps mt-1 text-[11px] text-ink-secondary">points</p>
        <p className="mt-2 font-condensed text-lg font-semibold text-ink">
          <span className="marker-gold">{reached} of {rounds} correct</span>
        </p>

        <div className="mt-6 w-full max-w-xs">
          <ChainTimeline position={rounds} total={rounds} wrongRounds={wrongRounds} />
        </div>

        {/* The answers, ranked - admire the finished puzzle */}
        {ranked.length > 0 && (
          <div className="mt-7 w-full max-w-xs">
            <p className="small-caps text-center text-[10px] font-bold text-ink-secondary">
              The answers · highest to lowest
            </p>
            <ul className="card-ink tilt-l mt-2.5 overflow-hidden rounded-xl text-left">
              {ranked.map((c, i) => (
                <li
                  key={c.id}
                  className={`flex items-center gap-2.5 px-3.5 py-2 ${i > 0 ? "border-t-2 border-border" : ""}`}
                >
                  <span className="w-5 shrink-0 font-condensed text-sm font-semibold text-ink-secondary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                    {c.entity_name}
                  </span>
                  <span className="tabular shrink-0 font-condensed text-sm font-semibold text-ink">
                    {formatStat(c.stat_value)}
                    {statUnit ? <span className="text-ink-secondary"> {statUnit}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
