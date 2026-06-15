"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CardPair } from "./CardPair";
import { LivesDisplay } from "./LivesDisplay";
import { ProgressBar } from "./ProgressBar";
import { ResultSheet } from "./ResultSheet";
import { useGame, type GamePhase } from "@/hooks/useGame";
import { formatDisplayDate } from "@/lib/date";
import type { FullGame } from "@/types";

interface GameBoardProps {
  game: FullGame;
  isArchive: boolean;
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

export function GameBoard({ game, isArchive }: GameBoardProps) {
  const state = useGame(game.cards, game.play_date);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Open the end sheet when the game completes; a peek/reopen control handles
  // the case where the player dismisses it to look at the final board.
  useEffect(() => {
    if (state.phase === "complete") setSheetOpen(true);
  }, [state.phase]);

  const hint = hintFor(state.phase);

  return (
    <>
      <ProgressBar value={state.score} max={state.best} />

      <main className="mx-auto flex min-h-dvh w-full max-w-game flex-col px-4 pb-10 pt-5">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-extrabold tracking-tight text-ink">
            WhoHadMore
          </Link>
          <LivesDisplay lives={state.lives} />
        </header>

        {isArchive && (
          <div className="mt-3 rounded-xl border border-border bg-surface px-3 py-2 text-center text-xs text-ink-secondary">
            You&apos;re playing the archive —{" "}
            <span className="font-semibold text-ink">
              {formatDisplayDate(game.play_date)}
            </span>
          </div>
        )}

        {/* Topic + stat */}
        <div className="mt-8 text-center">
          <p className="small-caps text-xs text-ink-secondary">{game.topic_label}</p>
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

        {/* Reopen control if the end sheet was dismissed */}
        {state.phase === "complete" && !sheetOpen && (
          <button
            onClick={() => setSheetOpen(true)}
            className="mx-auto rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold text-ink"
          >
            Show results
          </button>
        )}
      </main>

      <ResultSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        score={state.score}
        best={state.best}
        lives={state.lives}
        timeSeconds={state.elapsedSeconds}
        topicLabel={game.topic_label}
        playDate={game.play_date}
        isArchive={isArchive}
        onRestart={() => {
          setSheetOpen(false);
          state.restart();
        }}
      />
    </>
  );
}
