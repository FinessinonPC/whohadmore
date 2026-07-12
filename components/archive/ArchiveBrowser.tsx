"use client";

import Link from "next/link";
import { useState } from "react";
import { ArchiveCalendar } from "./ArchiveCalendar";
import { ArchiveList } from "./ArchiveList";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES } from "@/lib/modes";
import { type ArchiveFilter } from "@/hooks/useArchiveScores";
import { useProfile } from "@/hooks/useProfile";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };
type Filter = ArchiveFilter;

/**
 * The archive's interactive shell: a game filter over the calendar/list.
 * "All games" opens a day's hub; picking one game deep-links every day
 * straight into that game - binge a whole run of Chains (or Minis) in a row.
 */
export function ArchiveBrowser({ games }: { games: NumberedGame[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { profile } = useProfile();
  const signedIn = Boolean(profile?.username);

  const hrefFor = (date: string) =>
    filter === "all"
      ? `/day/${date}`
      : LIVE_MODES.find((m) => m.id === filter)?.href(date) ?? `/day/${date}`;

  return (
    <div>
      {/* A gentle nudge: past days are the reason to make an account. */}
      {!signedIn && (
        <Link
          href="/profile"
          className="card-ink tilt-l mb-5 flex items-center justify-between gap-3 px-5 py-3.5 text-ink transition-transform hover:scale-[1.01]"
        >
          <span className="text-sm font-bold leading-snug">
            Unlock every past day - free. Sign in to replay the archive and bank your scores.
          </span>
          <span className="text-xl">→</span>
        </Link>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`wonky border-2 border-ink px-4 py-1.5 text-xs font-bold transition-colors ${
            filter === "all" ? "bg-cta text-background" : "bg-surface text-ink-secondary hover:text-ink"
          }`}
        >
          All games
        </button>
        {LIVE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilter(m.id)}
            className={`wonky border-2 px-3.5 py-1.5 text-ink transition-all ${
              filter === m.id
                ? "ink-fix border-ink"
                : "border-ink/25 bg-surface opacity-75 hover:opacity-100"
            }`}
            style={filter === m.id ? { background: m.pastel } : undefined}
          >
            <GameWordmark mode={m.id} className="text-sm" alt={m.accent} />
          </button>
        ))}
        {filter !== "all" && (
          <span className="text-[11px] font-semibold text-ink-secondary">
            days open straight into {LIVE_MODES.find((m) => m.id === filter)?.name}
          </span>
        )}
      </div>

      {/* Calendar on desktop, list on mobile */}
      <div className="hidden sm:block">
        <ArchiveCalendar games={games} hrefFor={hrefFor} filter={filter} />
      </div>
      <div className="sm:hidden">
        <ArchiveList games={games} hrefFor={hrefFor} filter={filter} />
      </div>
    </div>
  );
}
