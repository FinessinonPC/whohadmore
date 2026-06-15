"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge, categoryLabel } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatShortDate } from "@/lib/date";
import type { DailyGame } from "@/types";

interface ArchiveBrowserProps {
  games: DailyGame[]; // published, newest first
}

interface MonthGroup {
  key: string; // "2026-06"
  label: string; // "June 2026"
  games: DailyGame[];
}

function groupByMonth(games: DailyGame[]): MonthGroup[] {
  const map = new Map<string, DailyGame[]>();
  for (const g of games) {
    const key = g.play_date.slice(0, 7);
    (map.get(key) ?? map.set(key, []).get(key)!).push(g);
  }
  return Array.from(map.entries()).map(([key, list]) => {
    const [y, m] = key.split("-").map(Number);
    return {
      key,
      label: new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }),
      games: list,
    };
  });
}

const PAGE = 1; // months revealed per "load more"

export function ArchiveBrowser({ games }: ArchiveBrowserProps) {
  const months = useMemo(() => groupByMonth(games), [games]);
  const [visible, setVisible] = useState(PAGE);

  if (games.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-secondary">
        No games published yet. Check back soon.
      </p>
    );
  }

  const shown = months.slice(0, visible);
  const hasMore = visible < months.length;

  return (
    <div className="flex flex-col gap-10">
      {shown.map((month) => (
        <section key={month.key}>
          <h2 className="mb-3 small-caps text-xs text-ink-secondary">
            {month.label}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {month.games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              >
                <Link
                  href={`/play/${game.play_date}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-border/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-secondary">
                        {formatShortDate(game.play_date)}
                      </span>
                      <Badge tone="category">{categoryLabel(game.topic_category)}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-ink">
                      {game.topic_label}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-white">
                    Play
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE)}>
            Load earlier months
          </Button>
        </div>
      )}
    </div>
  );
}
