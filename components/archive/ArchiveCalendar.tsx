"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categoryLabel } from "@/components/ui/Badge";
import { getLocalResult } from "@/lib/playStore";
import { todayISO } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };

interface ArchiveCalendarProps {
  games: NumberedGame[];
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => n.toString().padStart(2, "0");

export function ArchiveCalendar({ games }: ArchiveCalendarProps) {
  const today = todayISO();
  const [ty, tm] = today.split("-").map(Number);

  const byDate = useMemo(() => {
    const m: Record<string, NumberedGame> = {};
    games.forEach((g) => (m[g.play_date] = g));
    return m;
  }, [games]);

  // Start on the most recent month that has a game (usually the current month).
  const latest = useMemo(
    () => games.map((g) => g.play_date).sort().slice(-1)[0] ?? today,
    [games, today]
  );
  const [ly, lm] = latest.split("-").map(Number);
  const [year, setYear] = useState(ly);
  const [month, setMonth] = useState(lm - 1); // 0-based

  const [played, setPlayed] = useState<Record<string, { reached: number; rounds: number }>>({});
  useEffect(() => {
    const map: Record<string, { reached: number; rounds: number }> = {};
    games.forEach((g) => {
      const r = getLocalResult(g.play_date);
      if (r) map[g.play_date] = { reached: r.reached, rounds: r.rounds };
    });
    setPlayed(map);
  }, [games]);

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

  // Don't let players page into the future (no games there).
  const atCurrentMonth = year === ty && month === tm - 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">{label}</h2>
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

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-1 text-center text-[10px] font-bold uppercase text-ink-secondary">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const game = byDate[dateStr];
          const isToday = dateStr === today;
          const result = played[dateStr];

          if (!game) {
            return (
              <div
                key={dateStr}
                className={`flex min-h-[76px] flex-col rounded-xl border border-border/60 p-1.5 sm:min-h-[96px] ${
                  isToday ? "ring-1 ring-ink/20" : ""
                }`}
              >
                <span className="text-[11px] font-bold text-ink-secondary/50">{day}</span>
              </div>
            );
          }

          return (
            <Link
              key={dateStr}
              href={`/play/${dateStr}`}
              title={game.topic_label}
              className={`group flex min-h-[76px] flex-col gap-0.5 rounded-xl border p-1.5 transition-colors sm:min-h-[96px] ${
                result
                  ? "border-correct/30 bg-correct/10 hover:bg-correct/20"
                  : "border-border bg-surface hover:border-ink/30"
              } ${isToday ? "ring-2 ring-ink/30" : ""}`}
            >
              <span className="text-[11px] font-bold text-ink">{day}</span>
              <span className="line-clamp-2 text-[9px] font-semibold leading-tight text-ink/80 sm:text-[11px]">
                {game.topic_label}
              </span>
              <span className="mt-auto flex items-center justify-between">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor(game.topic_category) }}
                  title={categoryLabel(game.topic_category)}
                />
                {result && (
                  <span className="tabular text-[9px] font-bold text-correct sm:text-[10px]">
                    {result.reached}/{result.rounds}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-correct/30 bg-correct/10" /> Played
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-surface" /> Available
        </span>
        <span>Tap any day to play that game.</span>
      </div>
    </div>
  );
}

function categoryColor(category: DailyGame["topic_category"]): string {
  switch (category) {
    case "sports":
      return "#00C853";
    case "geography":
      return "#1E88E5";
    case "entertainment":
      return "#E040FB";
    case "science":
      return "#FF7A00";
    case "current_events":
      return "#FFB300";
    default:
      return "#888888";
  }
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
