"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { CardPair } from "./CardPair";
import { LivesDisplay } from "./LivesDisplay";
import { ProgressBar } from "./ProgressBar";
import { useGame, type GamePhase, type GameResultSummary } from "@/hooks/useGame";
import { formatShortDate } from "@/lib/date";
import type { FullGame } from "@/types";

interface GameBoardProps {
  game: FullGame;
  date: string;
  gameNumber: number;
  onComplete: (result: GameResultSummary) => void;
  /** Embedded in the admin preview — hide site nav so nothing navigates away. */
  embedded?: boolean;
}

function hintFor(phase: GamePhase): { text: string; tone: string } {
  switch (phase) {
    case "reveal-correct":
    case "transitioning":
      return { text: "Correct", tone: "text-correct" };
    case "reveal-wrong":
      return { text: "Not quite — try the other one", tone: "text-wrong" };
    default:
      return { text: "Tap whoever had more", tone: "text-ink-secondary" };
  }
}

export function GameBoard({
  game,
  date,
  gameNumber,
  onComplete,
  embedded = false,
}: GameBoardProps) {
  const state = useGame(game.cards, { onComplete });

  // Preload every card image so slides reveal instantly instead of popping in.
  useEffect(() => {
    game.cards.forEach((c) => {
      if (c.image_url) {
        const img = new window.Image();
        img.src = c.image_url;
      }
    });
  }, [game]);

  const hint = hintFor(state.phase);

  return (
    <>
      <ProgressBar value={state.score} max={state.best} />

      <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-4 pb-10 pt-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {embedded ? (
              <span className="text-sm font-extrabold tracking-tight text-ink">Preview</span>
            ) : (
              <>
                <Link href="/" className="text-sm font-extrabold tracking-tight text-ink">
                  WhoHadMore
                </Link>
                <Link
                  href="/archive"
                  className="text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
                >
                  Archive
                </Link>
              </>
            )}
          </div>
          <LivesDisplay lives={state.lives} />
        </header>

        {/* Date + game number + topic */}
        <div className="mt-7 text-center">
          <p className="small-caps text-[11px] text-ink-secondary">
            {formatShortDate(date)} · {embedded ? "Preview" : `Game No. ${gameNumber}`}
          </p>
          <p className="mt-2 small-caps text-xs text-ink-secondary">{game.topic_label}</p>
          <p className="mt-1 text-[13px] text-ink-secondary">{game.stat_label}</p>
        </div>

        {/* The two cards */}
        <div className="flex flex-1 flex-col justify-center py-6">
          {state.pair && (
            <CardPair
              pair={state.pair}
              statUnit={game.stat_unit}
              phase={state.phase}
              chosenSide={state.chosenSide}
              revealRight={state.revealRight}
              onGuess={state.guess}
            />
          )}

          {/* Status / hint line */}
          <div className="mt-7 flex h-6 items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={hint.text}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className={`text-sm font-semibold ${hint.tone}`}
              >
                {state.phase === "complete" ? "" : hint.text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}
