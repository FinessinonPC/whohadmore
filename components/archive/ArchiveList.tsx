"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { useArchiveScores, type ArchiveFilter } from "@/hooks/useArchiveScores";
import { modeDef } from "@/lib/modes";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };

const BRAND = "#00C853";
const accentFor = (filter: ArchiveFilter) => (filter === "all" ? BRAND : modeDef(filter).accent);
const contrastFor = (filter: ArchiveFilter) => (filter === "all" ? "#0B0D10" : modeDef(filter).contrast);

/** Mobile-friendly scrollable list of every game, newest first. No performance
 *  grading - played days show their score, and days you haven't played invite a
 *  tap (which nudges sign-in for past days). */
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
  const accent = accentFor(filter);
  const contrast = contrastFor(filter);
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
                  className="shrink-0 rounded-full border px-2.5 py-1 font-condensed text-sm font-semibold tabular text-ink"
                  style={{ background: `${accent}14`, borderColor: `${accent}55` }}
                >
                  {score.points.toLocaleString()} pts
                </span>
              ) : (
                <span
                  className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold"
                  style={{ background: accent, color: contrast }}
                >
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
