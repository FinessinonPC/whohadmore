"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
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

// Timings (ms) — tuned so the count-up fully lands before we move on.
const REVEAL_HOLD = 1000; // pause on a correct reveal before sliding
const SLIDE_DURATION = 520; // matches the CardPair slide transition
const WRONG_HOLD = 1200; // pause after a wrong guess before retrying

export type GamePhase =
  | "idle"
  | "reveal-correct"
  | "reveal-wrong"
  | "transitioning"
  | "complete";

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
  /** Right card reveals its value during a correct reveal / transition. */
  revealRight: boolean;
  elapsedSeconds: number;
  guess: (side: Side) => void;
  restart: () => void;
}

const SESSION_KEY = "whohadmore_session_id";

/** Stable anonymous id, persisted in localStorage. (Swapped for user_id later.) */
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useGame(cards: GameCard[], playDate: string): UseGameState {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [chosenSide, setChosenSide] = useState<Side | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Pending timers, cleared on unmount / restart so callbacks never fire late.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef<number>(Date.now());
  const savedRef = useRef(false);

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
      setChosenSide(side);

      if (correct) {
        // Reveal the right card (count-up), hold, then slide the chain forward.
        setPhase("reveal-correct");
        schedule(() => {
          setScore((s) => s + 1);
          if (isLastPair(currentIndex, total)) {
            setPhase("complete");
            return;
          }
          // Advancing the index drives the slide: old left exits, old right
          // (now revealed) moves into the left slot, a fresh hidden right enters.
          setCurrentIndex((i) => i + 1);
          setPhase("transitioning");
          schedule(() => {
            setChosenSide(null);
            setPhase("idle");
          }, SLIDE_DURATION);
        }, REVEAL_HOLD);
      } else {
        setPhase("reveal-wrong");
        const remaining = lives - 1;
        setLives(remaining);
        schedule(() => {
          if (remaining <= 0) {
            setPhase("complete");
          } else {
            // Same pair — value stays hidden so the reveal still pays off.
            setChosenSide(null);
            setPhase("idle");
          }
        }, WRONG_HOLD);
      }
    },
    [phase, pair, currentIndex, total, lives, schedule]
  );

  const restart = useCallback(() => {
    clearTimers();
    savedRef.current = false;
    startedAt.current = Date.now();
    setCurrentIndex(0);
    setLives(STARTING_LIVES);
    setScore(0);
    setChosenSide(null);
    setPhase("idle");
    setElapsedSeconds(0);
  }, [clearTimers]);

  // Persist the result once, the moment the game completes.
  useEffect(() => {
    if (phase !== "complete" || savedRef.current) return;
    savedRef.current = true;

    const seconds = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
    setElapsedSeconds(seconds);

    const livesRemaining = lives;
    const finalScore = score;

    // TODO: replace session_id with user_id when auth is implemented.
    void (async () => {
      try {
        const supabase = getBrowserSupabase();
        await supabase.from("game_results").insert({
          play_date: playDate,
          session_id: getSessionId(),
          score: finalScore,
          lives_remaining: livesRemaining,
          completed: true,
          time_seconds: seconds,
        });
      } catch {
        // Result tracking is best-effort; never block the end screen on it.
      }
    })();
  }, [phase, lives, score, playDate]);

  // Only the pair being judged reveals its right value. Once the index
  // advances (transitioning), the incoming right card stays hidden.
  const revealRight = phase === "reveal-correct";

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
