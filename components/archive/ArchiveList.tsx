"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { scoreTier, useArchiveScores, type ArchiveFilter } from "@/hooks/useArchiveScores";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };

// Performance band -> pill styling.
const TIER: Record<string, string> = {
  great: "border-correct/30 bg-correct/10 text-correct",
  good: "border-[#FFB300]/40 bg-[#FFB300]/10 text-[#9A6A00]",
  rough: "border-wrong/30 bg-wrong/10 text-wrong",
  none: "border-border bg-surface text-ink-secondary",
};

/** Mobile-friendly scrollable list of every game, newest first. */
export function ArchiveList({
  games,
  hrefFor,
  filter = "all",
}: {
  games: NumberedGame[];
  hrefFor?: (date: string) => string;
  filter?: ArchiveFilter;
}) {
  const scoreFor = useArchiveScores(games);
  const sorted = useMemo(
    () => [...games].sort((a, b) => (a.play_date < b.play_date ? 1 : -1)),
    [games]
  );

  if (sorted.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-secondary">
        No games published yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {sorted.map((game) => {
        const score = scoreFor(game.play_date, filter);
        const tier = scoreTier(score);
        return (
          <li key={game.id}>
            <Link
              href={hrefFor ? hrefFor(game.play_date) : `/day/${game.play_date}`}
              className="flex items-center gap-3 py-3.5 transition-colors hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">
                  <span className="font-condensed text-ink-secondary">No. {game.game_number}</span>
                  <span className="mx-1.5 text-ink-secondary">·</span>
                  {game.topic_label}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-ink-secondary">{formatShortDate(game.play_date)}</span>
                  <Badge tone="category">{categoryLabel(game.topic_category)}</Badge>
                </div>
              </div>
              {score.played ? (
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 font-condensed text-sm font-semibold tabular ${TIER[tier]}`}
                >
                  {score.points.toLocaleString()} pts
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-cta px-4 py-1.5 text-xs font-bold text-background">
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
