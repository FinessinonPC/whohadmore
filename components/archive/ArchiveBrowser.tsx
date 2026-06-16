"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { getLocalResult } from "@/lib/playStore";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };

interface ArchiveBrowserProps {
  games: NumberedGame[]; // newest first
}

export function ArchiveBrowser({ games }: ArchiveBrowserProps) {
  // Played status lives in localStorage, so resolve it after mount.
  const [played, setPlayed] = useState<Record<string, { reached: number; rounds: number }>>({});

  useEffect(() => {
    const map: Record<string, { reached: number; rounds: number }> = {};
    for (const g of games) {
      const r = getLocalResult(g.play_date);
      if (r) map[g.play_date] = { reached: r.reached, rounds: r.rounds };
    }
    setPlayed(map);
  }, [games]);

  if (games.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-secondary">
        No games published yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {games.map((game) => {
        const result = played[game.play_date];
        return (
          <li key={game.id}>
            <Link
              href={`/play/${game.play_date}`}
              className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface"
            >
              <span className="w-12 shrink-0 text-center tabular text-xs font-bold text-ink-secondary">
                {game.game_number}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{game.topic_label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-ink-secondary">
                    {formatShortDate(game.play_date)}
                  </span>
                  <Badge tone="category">{categoryLabel(game.topic_category)}</Badge>
                </div>
              </div>

              {result ? (
                <span className="shrink-0 rounded-full border border-correct/30 bg-correct/10 px-3 py-1 text-xs font-semibold text-correct">
                  {result.reached}/{result.rounds}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-white">
                  Play
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
