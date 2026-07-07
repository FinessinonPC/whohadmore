"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { QUADS_MAX_MISTAKES, QUADS_POINTS_PER_GROUP, modeDef } from "@/lib/modes";
import { getQuadsDaily } from "@/lib/contentPacks";
import { hashSeed, mulberry32, seededShuffle } from "@/lib/seed";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";

const ACCENT = modeDef("quads").accent;
// Difficulty colors for found groups, easy -> tricky (the familiar scheme).
const GROUP_COLORS = ["#FFC400", "#00C853", "#2E6BFF", "#A44BFF"];
const GROUP_INK = ["#0B0D10", "#0B0D10", "#FFFFFF", "#FFFFFF"];

/**
 * Quads: sixteen words hide four groups of four. Pick four, lock them in;
 * four mistakes and the rest is revealed. 250 points per group found.
 */
export function QuadsGame({ date }: { date: string }) {
  const day = getQuadsDaily(date);

  // Same board order for everyone today (communal puzzle).
  const board = useMemo(() => {
    const words = day.groups.flatMap((g) => g.words);
    return seededShuffle(words, mulberry32(hashSeed(`quads:${date}:board`)));
  }, [day, date]);

  const [selected, setSelected] = useState<string[]>([]);
  const [found, setFound] = useState<number[]>([]); // group indexes, in found order
  const [mistakes, setMistakes] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("quads", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const failed = mistakes >= QUADS_MAX_MISTAKES;
  const solved = found.length === day.groups.length;
  const done = failed || solved;
  const score = found.length * QUADS_POINTS_PER_GROUP;
  const max = day.groups.length * QUADS_POINTS_PER_GROUP;

  const groupOf = (word: string) => day.groups.findIndex((g) => g.words.includes(word));
  const remaining = board.filter((w) => !found.includes(groupOf(w)));

  const toggle = (word: string) => {
    if (done) return;
    setNote(null);
    setSelected((s) =>
      s.includes(word) ? s.filter((w) => w !== word) : s.length < 4 ? [...s, word] : s
    );
  };

  const submit = () => {
    if (selected.length !== 4 || done) return;
    const groups = selected.map(groupOf);
    const target = groups[0];
    if (groups.every((g) => g === target)) {
      setFound((f) => [...f, target]);
      setSelected([]);
      feedbackCorrect();
    } else {
      const counts = new Map<number, number>();
      groups.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
      const best = Math.max(...counts.values());
      setNote(best === 3 ? "One away!" : null);
      setMistakes((m) => m + 1);
      setSelected([]);
      feedbackWrong();
    }
  };

  // Persist once finished.
  useEffect(() => {
    if (!done) return;
    if (getModeResult("quads", date)) return;
    saveModeResult("quads", date, {
      score,
      maxScore: max,
      detail: [found.length, mistakes],
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "quads", score }),
    }).catch(() => {});
  }, [done, score, max, date, found.length, mistakes]);

  if (already) {
    return (
      <GameShell mode="quads" date={date}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Already played</p>
          <p className="mt-3 font-condensed text-6xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-3xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mb-6 mt-2 text-sm text-ink-secondary">A new board drops tomorrow.</p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="quads" />
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell mode="quads" date={date}>
      <p className="text-center text-xs font-semibold text-ink-secondary">
        Find four groups of four
      </p>

      {/* found groups collapse into colored banners */}
      <div className="mt-4 flex flex-col gap-2">
        {found.map((gIdx, order) => (
          <motion.div
            key={gIdx}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl px-4 py-3 text-center"
            style={{ background: GROUP_COLORS[order], color: GROUP_INK[order] }}
          >
            <p className="font-condensed text-lg font-semibold uppercase tracking-wide leading-none">
              {day.groups[gIdx].name}
            </p>
            <p className="mt-1 text-[11px] font-bold opacity-80">
              {day.groups[gIdx].words.join(" · ")}
            </p>
          </motion.div>
        ))}

        {/* the grid */}
        {remaining.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {remaining.map((word) => {
              const isSel = selected.includes(word);
              return (
                <button
                  key={word}
                  onClick={() => toggle(word)}
                  className={`flex min-h-[3.6rem] items-center justify-center rounded-xl px-1 py-2 text-center font-condensed text-[13px] font-semibold uppercase leading-tight tracking-wide transition-all active:scale-95 ${
                    isSel ? "bg-cta text-background" : "bg-surface text-ink"
                  }`}
                >
                  <span className="break-words">{word}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* failed: reveal what was left */}
        {failed &&
          day.groups.map((g, gIdx) =>
            found.includes(gIdx) ? null : (
              <div
                key={g.name}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-center"
              >
                <p className="font-condensed text-lg font-semibold uppercase tracking-wide leading-none text-ink-secondary">
                  {g.name}
                </p>
                <p className="mt-1 text-[11px] font-bold text-ink-secondary opacity-80">
                  {g.words.join(" · ")}
                </p>
              </div>
            )
          )}
      </div>

      {/* status row */}
      <div className="mt-4 flex h-8 items-center justify-center gap-3">
        {done ? (
          <p className="font-condensed text-2xl font-semibold uppercase tracking-wide text-ink">
            {solved ? `Perfect · +${score}` : `+${score}`}
          </p>
        ) : (
          <>
            {note && <span className="text-sm font-bold text-ink">{note}</span>}
            <span className="flex items-center gap-1.5">
              {Array.from({ length: QUADS_MAX_MISTAKES }).map((_, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: i < QUADS_MAX_MISTAKES - mistakes ? ACCENT : "rgb(var(--border))",
                  }}
                />
              ))}
            </span>
            <span className="text-[11px] font-semibold text-ink-secondary">mistakes left</span>
          </>
        )}
      </div>

      {/* actions */}
      <div className="mt-auto pb-1 pt-4">
        {done ? (
          <NextGameCTA date={date} current="quads" />
        ) : (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="lg"
              className="shrink-0"
              onClick={() => setSelected([])}
              disabled={selected.length === 0}
            >
              Clear
            </Button>
            <Button size="lg" className="w-full" onClick={submit} disabled={selected.length !== 4}>
              {selected.length === 4 ? "Lock it in" : `Pick ${4 - selected.length} more`}
            </Button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
