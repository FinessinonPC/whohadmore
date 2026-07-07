"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminClient";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES } from "@/lib/modes";
import { themeFor } from "@/lib/weekly";
import { formatDisplayDate } from "@/lib/date";
import type { DailyGame } from "@/types";

/**
 * The at-a-glance state of a day's WHOLE slate - all four games as equal
 * tiles with their status, so the day editor stops feeling chain-first.
 */
export function DayOverview({ date }: { date: string }) {
  const [game, setGame] = useState<DailyGame | null | undefined>(undefined);
  const [custom, setCustom] = useState<Record<string, unknown>>({});

  useEffect(() => {
    adminFetch(`/api/admin/game/${date}`)
      .then((r) => r.json())
      .then((d: { game?: DailyGame | null }) => setGame(d.game ?? null))
      .catch(() => setGame(null));
    adminFetch(`/api/admin/minigame?date=${date}`)
      .then((r) => r.json())
      .then((d: { custom?: Record<string, unknown> }) => setCustom(d.custom ?? {}))
      .catch(() => setCustom({}));
  }, [date]);

  const chainStatus =
    game === undefined ? "…" : game === null ? "Empty" : game.published ? "Published" : "Draft";
  const chainTone =
    game === undefined
      ? "border-border bg-surface text-ink-secondary"
      : game === null
        ? "border-wrong/40 bg-wrong/10 text-wrong"
        : game.published
          ? "border-correct/40 bg-correct/10 text-correct"
          : "border-[#FFB300]/50 bg-[#FFB300]/10 text-[#B07A00]";

  return (
    <section className="mb-6">
      <p className="small-caps text-[11px] text-ink-secondary">
        {formatDisplayDate(date)} · {themeFor(date).name}
      </p>
      <h1 className="mt-1 font-condensed text-3xl font-semibold uppercase tracking-wide text-ink">
        This day&apos;s slate
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {LIVE_MODES.map((m) => {
          const isChain = m.id === "chain";
          const isCustom = Boolean(custom[m.id]);
          return (
            <a
              key={m.id}
              href={isChain ? "#chain-editor" : "#minigames"}
              className="rounded-2xl border border-border bg-surface p-3.5 transition-colors hover:border-ink/25"
            >
              <span style={{ color: m.accent }}>
                <GameWordmark mode={m.id} className="text-lg" />
              </span>
              <p className="mt-2">
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isChain
                      ? chainTone
                      : isCustom
                        ? "border-correct/40 bg-correct/10 text-correct"
                        : "border-border bg-background text-ink-secondary"
                  }`}
                >
                  {isChain ? chainStatus : isCustom ? "Custom" : "Auto"}
                </span>
              </p>
              {isChain && game && (
                <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight text-ink-secondary">
                  {game.topic_label}
                </p>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
