"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GameBoard } from "./GameBoard";
import { StartScreen } from "./StartScreen";
import { ResultScreen } from "./ResultScreen";
import {
  clearLocalResult,
  getLocalResult,
  getSessionId,
  saveLocalResult,
  type StoredResult,
} from "@/lib/playStore";
import { msUntilNextGameMidnight } from "@/lib/date";
import type { GameResultSummary } from "@/hooks/useGame";
import type { FullGame } from "@/types";

interface PlayExperienceProps {
  initialGame: FullGame | null;
  date: string;
  gameNumber: number;
  isDaily: boolean;
}

type Mode = "start" | "playing" | "completed";

export function PlayExperience({
  initialGame,
  date,
  gameNumber,
  isDaily,
}: PlayExperienceProps) {
  const router = useRouter();
  const playable = Boolean(initialGame && initialGame.cards.length >= 2);

  const [mode, setMode] = useState<Mode>("start");
  const [result, setResult] = useState<StoredResult | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  // On load / whenever the day changes (midnight roll-over), restore any saved
  // result for that date so a finished game stays finished.
  useEffect(() => {
    const stored = getLocalResult(date);
    if (stored) {
      setResult(stored);
      setAlreadyPlayed(true);
      setMode("completed");
    } else {
      setResult(null);
      setAlreadyPlayed(false);
      setMode("start");
    }
  }, [date]);

  // Daily game auto-rolls to the next day at midnight (game timezone).
  useEffect(() => {
    if (!isDaily) return;
    const t = setTimeout(() => router.refresh(), msUntilNextGameMidnight() + 1500);
    return () => clearTimeout(t);
  }, [isDaily, date, router]);

  const handleComplete = useCallback(
    (summary: GameResultSummary) => {
      const stored: StoredResult = {
        score: summary.score,
        best: summary.best,
        lives: summary.lives,
        timeSeconds: summary.timeSeconds,
        completedAt: new Date().toISOString(),
      };
      saveLocalResult(date, stored);
      setResult(stored);
      setAlreadyPlayed(false);
      setMode("completed");

      // Record the result + update leaderboard stats (best-effort; the route is
      // idempotent per session+date). Identity is the anonymous session_id.
      void fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: getSessionId(),
          play_date: date,
          score: summary.score,
          best: summary.best,
          lives: summary.lives,
          time_seconds: summary.timeSeconds,
        }),
      }).catch(() => {
        /* never block the end screen on result tracking */
      });
    },
    [date]
  );

  if (!playable) {
    return <EmptyState date={date} isDaily={isDaily} />;
  }
  const game = initialGame as FullGame;

  // Testing-only: wipe this date's saved result and return to the start screen.
  // Remove the onReset prop (and the button) before the public launch.
  const resetForTesting = () => {
    clearLocalResult(date);
    setResult(null);
    setAlreadyPlayed(false);
    setMode("start");
  };

  if (mode === "completed" && result) {
    return (
      <ResultScreen
        score={result.score}
        best={result.best}
        lives={result.lives}
        timeSeconds={result.timeSeconds}
        topicLabel={game.topic_label}
        date={date}
        gameNumber={gameNumber}
        mode="play"
        alreadyPlayed={alreadyPlayed}
        onReset={resetForTesting}
      />
    );
  }

  if (mode === "playing") {
    return (
      <GameBoard
        game={game}
        date={date}
        gameNumber={gameNumber}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <StartScreen
      game={game}
      date={date}
      gameNumber={gameNumber}
      onStart={() => setMode("playing")}
    />
  );
}

function EmptyState({ date, isDaily }: { date: string; isDaily: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-game flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-extrabold text-ink">
        {isDaily ? "No game today" : "No game for this day"}
      </h1>
      <p className="text-sm text-ink-secondary">
        {isDaily ? "Check back soon — a new game drops daily." : "This date doesn't have a published game."}
      </p>
      <Link
        href="/archive"
        className="mt-2 rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold text-ink"
      >
        Browse the archive
      </Link>
    </main>
  );
}
