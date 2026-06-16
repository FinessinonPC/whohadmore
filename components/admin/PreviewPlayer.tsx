"use client";

import { useState } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ResultScreen } from "@/components/game/ResultScreen";
import { pointsForGame } from "@/lib/leaderboard";
import type { GameResultSummary } from "@/hooks/useGame";
import type { FullGame } from "@/types";

interface PreviewPlayerProps {
  game: FullGame;
  date: string;
  onClose: () => void;
}

/** Full-screen overlay that plays a draft game without saving any result. */
export function PreviewPlayer({ game, date, onClose }: PreviewPlayerProps) {
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<GameResultSummary | null>(null);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="fixed right-4 top-4 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-ink-secondary shadow-sm hover:text-ink"
      >
        ✕
      </button>

      {result ? (
        <ResultScreen
          reached={result.reached}
          rounds={result.rounds}
          lives={result.lives}
          timeSeconds={result.timeSeconds}
          wrongRounds={result.wrongRounds}
          xpEarned={pointsForGame(result.reached, result.rounds, 0)}
          topicLabel={game.topic_label}
          date={date}
          gameNumber={0}
          mode="preview"
          onPlayAgain={() => {
            setResult(null);
            setRunId((r) => r + 1);
          }}
          onClose={onClose}
        />
      ) : (
        <GameBoard
          key={runId}
          game={game}
          date={date}
          gameNumber={0}
          embedded
          onComplete={setResult}
        />
      )}
    </div>
  );
}
