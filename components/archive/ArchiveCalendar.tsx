"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocalResult } from "@/lib/playStore";
import { usePlayedResults } from "@/hooks/usePlayedResults";
import { todayISO } from "@/lib/date";
import type { DailyGame } from "@/types";

type NumberedGame = DailyGame & { game_number: number };
type PlayedResult = { reached: number; rounds: number };

interface ArchiveCalendarProps {
  games: NumberedGame[];
  /** Where a day cell links (defaults to that day's hub). */
  hrefFor?: (date: string) => string;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => n.toString().padStart(2, "0");

/** green = cleared, yellow = made it past 7, red = out before 7. */
function tierClass(reached: number, rounds: number): string {
  if (reached >= rounds) return "border-correct/45 bg-correct/15 hover:bg-correct/25";
  if (reached >= 7) return "border-[#FFB300]/50 bg-[#FFB300]/15 hover:bg-[#FFB300]/25";
  return "border-wrong/40 bg-wrong/12 hover:bg-wrong/20";
}
function tierText(reached: number, rounds: number): string {
  if (reached >= rounds) return "text-correct";
  if (reached >= 7) return "text-[#9A6A00]";
  return "text-wrong";
}

export function ArchiveCalendar({ games, hrefFor }: ArchiveCalendarProps) {
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

  const serverResults = usePlayedResults();
  const [local, setLocal] = useState<Record<string, PlayedResult>>({});
  useEffect(() => {
    const map: Record<string, PlayedResult> = {};
    games.forEach((g) => {
      const r = getLocalResult(g.play_date);
      if (r) map[g.play_date] = { reached: r.reached, rounds: r.rounds };
    });
    setLocal(map);
  }, [games]);
  const played: Record<string, PlayedResult> = useMemo(
    () => ({ ...serverResults, ...local }),
    [serverResults, local]
  );

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
          const result = played[dateStr];

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

          const state = result
            ? tierClass(result.reached, result.rounds)
            : "border-border bg-surface hover:border-ink/30";

          return (
            <Link
              key={dateStr}
              href={hrefFor ? hrefFor(dateStr) : `/day/${dateStr}`}
              title={game.topic_label}
              className={`group flex min-h-[84px] flex-col gap-1 rounded-xl border p-2 transition-colors sm:min-h-[112px] ${state} ${
                isToday ? "ring-2 ring-ink/30" : ""
              }`}
            >
              <span className="text-xs font-bold text-ink">{day}</span>
              <span className="font-condensed text-base font-semibold text-ink/85 sm:text-lg">
                No. {game.game_number}
              </span>
              {result && (
                <span className={`mt-auto tabular text-[10px] font-extrabold sm:text-xs ${tierText(result.reached, result.rounds)}`}>
                  {result.reached}/{result.rounds}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-ink-secondary">
        <Swatch className="border-correct/45 bg-correct/15" label="Cleared it" />
        <Swatch className="border-[#FFB300]/50 bg-[#FFB300]/15" label="Past 7" />
        <Swatch className="border-wrong/40 bg-wrong/12" label="Out before 7" />
        <Swatch className="border-border bg-surface" label="Not played" />
      </div>
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${className}`} /> {label}
    </span>
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
