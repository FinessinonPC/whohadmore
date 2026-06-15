"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPairAt,
  isCorrectGuess,
  isLastPair,
  maxScore,
  STARTING_LIVES,
  type ActivePair,
  type Side,
} from "@/lib/gameLogic";
import type { GameCard } from "@/types";

// Timings (ms). The count-up runs first with NO verdict (suspense); only after
// it lands do we reveal correct/wrong.
const COUNT_DURATION = 1900; // ~1.4s count-up + a ~0.5s suspense beat before the verdict
const VERDICT_HOLD = 800; // how long the verdict holds before sliding on
const SLIDE_DURATION = 480; // matches the CardPair slide transition

export type GamePhase =
  | "idle"
  | "counting"
  | "reveal-correct"
  | "reveal-wrong"
  | "transitioning"
  | "complete";

export interface GameResultSummary {
  score: number;
  best: number;
  lives: number;
  timeSeconds: number;
}

interface UseGameOptions {
  onComplete?: (result: GameResultSummary) => void;
}

export interface UseGameState {
  cards: GameCard[];
  currentIndex: number;
  lives: number;
  score: number;
  phase: GamePhase;
  chosenSide: Side | null;
  pair: ActivePair | null;
  total: number;
  best: number;
  /** Right card reveals its value during a correct reveal. */
  revealRight: boolean;
  elapsedSeconds: number;
  guess: (side: Side) => void;
  restart: () => void;
}

export function useGame(cards: GameCard[], opts: UseGameOptions = {}): UseGameState {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [chosenSide, setChosenSide] = useState<Side | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Pending timers, cleared on unmount / restart so callbacks never fire late.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // Keep the latest onComplete without re-arming effects.
  const onCompleteRef = useRef(opts.onComplete);
  useEffect(() => {
    onCompleteRef.current = opts.onComplete;
  });

  const total = cards.length;
  const best = maxScore(total);
  const pair = useMemo(() => getPairAt(cards, currentIndex), [cards, currentIndex]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const guess = useCallback(
    (side: Side) => {
      if (phase !== "idle" || !pair) return;

      const correct = isCorrectGuess(
        side,
        pair.left.stat_value,
        pair.right.stat_value
      );
      const livesAtGuess = lives;
      const idx = currentIndex;

      setChosenSide(side);
      // 1) Count the value up with no verdict yet — pure suspense.
      setPhase("counting");

      schedule(() => {
        // 2) The number has landed; now show the verdict and apply its effect.
        setPhase(correct ? "reveal-correct" : "reveal-wrong");
        if (correct) setScore((s) => s + 1);
        else setLives((l) => l - 1);

        schedule(() => {
          // 3) Either end the game or slide on to the next pair.
          const willComplete =
            isLastPair(idx, total) || (!correct && livesAtGuess - 1 <= 0);
          if (willComplete) {
            setPhase("complete");
            return;
          }
          setCurrentIndex((i) => i + 1);
          setPhase("transitioning");
          schedule(() => {
            setChosenSide(null);
            setPhase("idle");
          }, SLIDE_DURATION);
        }, VERDICT_HOLD);
      }, COUNT_DURATION);
    },
    [phase, pair, currentIndex, total, lives, schedule]
  );

  const restart = useCallback(() => {
    clearTimers();
    completedRef.current = false;
    startedAt.current = Date.now();
    setCurrentIndex(0);
    setLives(STARTING_LIVES);
    setScore(0);
    setChosenSide(null);
    setPhase("idle");
    setElapsedSeconds(0);
  }, [clearTimers]);

  // Freeze the clock and emit the result the moment the game completes (once).
  useEffect(() => {
    if (phase !== "complete" || completedRef.current) return;
    completedRef.current = true;
    const seconds = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
    setElapsedSeconds(seconds);
    onCompleteRef.current?.({ score, best, lives, timeSeconds: seconds });
  }, [phase, score, best, lives]);

  // The right value is visible while it counts up and through the verdict. Once
  // the index advances (transitioning), the incoming right card stays hidden.
  const revealRight =
    phase === "counting" ||
    phase === "reveal-correct" ||
    phase === "reveal-wrong";

  return {
    cards,
    currentIndex,
    lives,
    score,
    phase,
    chosenSide,
    pair,
    total,
    best,
    revealRight,
    elapsedSeconds,
    guess,
    restart,
  };
}
