"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  // date -> set of pack games with CUSTOM content that day (else auto pack).
  const [minis, setMinis] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Drag-to-move state.
  const [dragDate, setDragDate] = useState<string | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const monthKey = `${year}-${pad(month + 1)}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesRes, minisRes] = await Promise.all([
        adminFetch(`/api/admin/games?month=${monthKey}`),
        adminFetch(`/api/admin/minigame?month=${monthKey}`).catch(() => null),
      ]);
      const data = (await gamesRes.json()) as { games?: DailyGame[] };
      const map: Record<string, DailyGame> = {};
      (data.games ?? []).forEach((g) => (map[g.play_date] = g));
      setGames(map);

      const miniMap: Record<string, string[]> = {};
      if (minisRes) {
        const md = (await minisRes.json().catch(() => ({}))) as {
          rows?: { play_date: string; mode: string }[];
        };
        for (const row of md.rows ?? []) {
          (miniMap[row.play_date] ??= []).push(row.mode);
        }
      }
      setMinis(miniMap);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    void load();
  }, [load]);

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

  async function moveGame(from: string, to: string) {
    if (from === to) return;
    const fromGame = games[from];
    if (!fromGame) return;
    const target = games[to];
    if (target) {
      if (!confirm(`Swap dates between "${fromGame.topic_label}" and "${target.topic_label}"?`)) return;
    } else if (fromGame.published) {
      if (!confirm(`"${fromGame.topic_label}" is published. Move it to ${to}? ${from} will have no game.`)) return;
    }
    setMoving(true);
    try {
      const res = await adminFetch("/api/admin/move-game", {
        method: "POST",
        body: JSON.stringify({ from, to }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        alert(d.error ?? "Couldn't move the game.");
        return;
      }
      await load();
    } finally {
      setMoving(false);
    }
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
          const isDragging = dragDate === dateStr;
          const isOver = overDate === dateStr && dragDate !== dateStr;

          // Full-cell color coding: green = published, amber = draft, grey = empty.
          const stateClass = game?.published
            ? "border-correct bg-correct/20 hover:bg-correct/30"
            : game
              ? "border-[#FFB300] bg-[#FFB300]/25 hover:bg-[#FFB300]/35"
              : "border-border bg-surface/60 hover:bg-surface";
          const ring = isOver
            ? "ring-2 ring-ink ring-offset-1"
            : isToday
              ? "ring-2 ring-ink/40 ring-offset-1"
              : "";

          return (
            <button
              key={dateStr}
              draggable={Boolean(game) && !moving}
              onDragStart={(e) => {
                if (!game) return;
                setDragDate(dateStr);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", dateStr);
              }}
              onDragEnd={() => {
                setDragDate(null);
                setOverDate(null);
              }}
              onDragOver={(e) => {
                if (!dragDate || dragDate === dateStr) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overDate !== dateStr) setOverDate(dateStr);
              }}
              onDragLeave={() => {
                if (overDate === dateStr) setOverDate(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragDate ?? e.dataTransfer.getData("text/plain");
                setOverDate(null);
                setDragDate(null);
                if (from && from !== dateStr) void moveGame(from, dateStr);
              }}
              onClick={() => {
                if (!dragDate) router.push(`/admin/${dateStr}`);
              }}
              title={game ? "Drag to move · click to edit" : "Click to plan"}
              className={`flex aspect-square flex-col items-start gap-1 rounded-xl border-2 p-2 text-left transition-colors ${stateClass} ${ring} ${
                game ? "cursor-grab active:cursor-grabbing" : ""
              } ${isDragging ? "opacity-40" : ""} ${isOver ? "scale-[1.03]" : ""}`}
            >
              <span className="text-xs font-bold text-ink">{day}</span>
              {game && (
                <span className="pointer-events-none line-clamp-2 text-[10px] font-semibold leading-tight text-ink/90">
                  {game.topic_label}
                </span>
              )}
              {/* Pack-game dots: solid = custom content saved for this day,
                  faint = running on the auto pack rotation. */}
              <span className="pointer-events-none mt-auto flex gap-1">
                {[
                  { mode: "duality", color: "#06B6D4" },
                  { mode: "word", color: "#FFC400" },
                  { mode: "mini", color: "#2E6BFF" },
                ].map(({ mode, color }) => (
                  <span
                    key={mode}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: color,
                      opacity: minis[dateStr]?.includes(mode) ? 1 : 0.22,
                    }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-ink-secondary">
        {moving
          ? "Moving…"
          : loading
            ? "Loading…"
            : "Click a day to edit · drag a game onto another day to move it (or swap)."}
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
