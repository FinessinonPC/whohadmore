"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { todayISO } from "@/lib/date";
import { modeDef } from "@/lib/modes";
import { useArchiveScores, type ArchiveFilter } from "@/hooks/useArchiveScores";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };

interface ArchiveCalendarProps {
  games: NumberedGame[];
  /** Where a day cell links (defaults to that day's hub). */
  hrefFor?: (date: string) => string;
  /** Current game filter - drives which score each day shows and the accent. */
  filter?: ArchiveFilter;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => n.toString().padStart(2, "0");
const BRAND = "#00C853";

/** The accent for the current filter (brand green for "all"). Days aren't
 *  colored by performance anymore - just tinted to invite a play. */
function accentFor(filter: ArchiveFilter): string {
  return filter === "all" ? BRAND : modeDef(filter).accent;
}

export function ArchiveCalendar({ games, hrefFor, filter = "all" }: ArchiveCalendarProps) {
  const scoreFor = useArchiveScores(games);
  const accent = accentFor(filter);
  const today = todayISO();
  const [ty, tm] = today.split("-").map(Number);

  const byDate = useMemo(() => {
    const m: Record<string, NumberedGame> = {};
    games.forEach((g) => (m[g.play_date] = g));
    return m;
  }, [games]);

  const latest = useMemo(
    () => games.map((g) => g.play_date).sort().slice(-1)[0] ?? today,
    [games, today]
  );
  const [ly, lm] = latest.split("-").map(Number);
  const [year, setYear] = useState(ly);
  const [month, setMonth] = useState(lm - 1);

  const { cells, label } = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const lead: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return {
      cells: [...lead, ...days],
      label: new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
      }),
    };
  }, [year, month]);

  function shift(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }
  const atCurrentMonth = year === ty && month === tm - 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-ink">{label}</h2>
        <div className="flex items-center gap-1">
          <ArrowButton dir="prev" onClick={() => shift(-1)} />
          <button
            onClick={() => {
              setYear(ty);
              setMonth(tm - 1);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-surface"
          >
            Today
          </button>
          <ArrowButton dir="next" onClick={() => shift(1)} disabled={atCurrentMonth} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-bold uppercase text-ink-secondary">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const game = byDate[dateStr];
          const isToday = dateStr === today;

          if (!game) {
            return (
              <div
                key={dateStr}
                className={`flex min-h-[84px] flex-col rounded-xl border border-border/50 p-2 sm:min-h-[112px] ${
                  isToday ? "ring-1 ring-ink/20" : ""
                }`}
              >
                <span className="text-xs font-bold text-ink-secondary/40">{day}</span>
              </div>
            );
          }

          const score = scoreFor(dateStr, filter);

          return (
            <Link
              key={dateStr}
              href={hrefFor ? hrefFor(dateStr) : `/day/${dateStr}`}
              title={game.topic_label}
              className={`group flex min-h-[84px] flex-col gap-1 rounded-xl border p-2 transition-all hover:-translate-y-0.5 sm:min-h-[112px] ${
                isToday ? "ring-2 ring-ink/25" : ""
              }`}
              style={{
                background: score.played ? `${accent}18` : "rgb(var(--surface) / 0.5)",
                borderColor: score.played ? "rgb(var(--ink))" : "rgb(var(--ink) / 0.3)",
                borderStyle: score.played ? "solid" : "dashed",
                borderWidth: 2,
              }}
            >
              <span className="text-xs font-bold text-ink">{day}</span>
              <span className="font-condensed text-base font-semibold text-ink/85 sm:text-lg">
                No. {game.game_number}
              </span>
              {score.played ? (
                <span className="mt-auto tabular text-[11px] font-extrabold text-ink sm:text-sm">
                  {score.points.toLocaleString()}
                </span>
              ) : (
                <span
                  className="mt-auto text-[11px] font-bold opacity-70 transition-opacity group-hover:opacity-100 sm:text-xs"
                  style={{ color: accent }}
                >
                  Play →
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Inviting footer - no performance grading, just a nudge to play more */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border" style={{ background: `${accent}22`, borderColor: `${accent}66` }} />
          Played
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border" />
          Yours to play
        </span>
        <span className="text-border">·</span>
        <span>Every past day is free once you sign in</span>
      </div>
    </div>
  );
}

function ArrowButton({
  dir,
  onClick,
  disabled,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-secondary hover:bg-surface disabled:opacity-30"
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}
