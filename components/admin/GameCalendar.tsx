"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminClient";
import { todayISO } from "@/lib/date";
import type { DailyGame } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => n.toString().padStart(2, "0");

export function GameCalendar() {
  const router = useRouter();
  const today = todayISO();
  const [ty, tm] = today.split("-").map(Number);

  const [year, setYear] = useState(ty);
  const [month, setMonth] = useState(tm - 1); // 0-based
  const [games, setGames] = useState<Record<string, DailyGame>>({});
  const [loading, setLoading] = useState(true);

  const monthKey = `${year}-${pad(month + 1)}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await adminFetch(`/api/admin/games?month=${monthKey}`);
        const data = (await res.json()) as { games?: DailyGame[] };
        if (cancelled) return;
        const map: Record<string, DailyGame> = {};
        (data.games ?? []).forEach((g) => (map[g.play_date] = g));
        setGames(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

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
          <ArrowButton dir="next" onClick={() => shift(1)} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-secondary">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const game = games[dateStr];
          const isToday = dateStr === today;

          // Full-cell color coding: green = published, amber = draft, grey = empty.
          const stateClass = game?.published
            ? "border-correct bg-correct/20 hover:bg-correct/30"
            : game
              ? "border-[#FFB300] bg-[#FFB300]/25 hover:bg-[#FFB300]/35"
              : "border-border bg-surface/60 hover:bg-surface";

          return (
            <button
              key={dateStr}
              onClick={() => router.push(`/admin/${dateStr}`)}
              title="Open editor"
              className={`flex aspect-square flex-col items-start gap-1 rounded-xl border-2 p-2 text-left transition-colors ${stateClass} ${
                isToday ? "ring-2 ring-ink/40 ring-offset-1" : ""
              }`}
            >
              <span className="text-xs font-bold text-ink">{day}</span>
              {game && (
                <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-ink/90">
                  {game.topic_label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-ink-secondary">
        {loading ? "Loading…" : "Click a day to plan its game."}
      </p>
    </div>
  );
}

function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-secondary hover:bg-surface"
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}
