"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { DUALITY_MAX_MISTAKES, DUALITY_POINTS_PER_PAIR, modeDef } from "@/lib/modes";
import { hashSeed, mulberry32, seededShuffle } from "@/lib/seed";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import type { DualityDay } from "@/lib/contentPacks";

const ACCENT = modeDef("duality").accent;
// Difficulty colors for matched pairs, easy -> hard (the familiar scheme).
const PAIR_COLORS = ["#FFC400", "#00C853", "#2E6BFF", "#A44BFF"];
const PAIR_INK = ["#0B0D10", "#0B0D10", "#FFFFFF", "#FFFFFF"];

/**
 * Duality: eight definitions hide four pairs - each pair is two meanings of
 * the SAME word. Tap two that go together; matched pairs collapse into
 * difficulty-colored banners that reveal the word. Four mistakes allowed.
 * 250 points per pair. Content resolves server-side and arrives as a prop.
 */
export function DualityGame({ day, date }: { day: DualityDay; date: string }) {
  // Board: the 8 defs shuffled the same way for everyone today.
  const board = useMemo(() => {
    const defs = day.pairs.flatMap((p, pi) =>
      p.defs.map((text) => ({ text, pair: pi }))
    );
    return seededShuffle(defs, mulberry32(hashSeed(`duality:${date}:board`)));
  }, [day, date]);

  const [selected, setSelected] = useState<string[]>([]);
  const [found, setFound] = useState<number[]>([]); // pair indexes, in found order
  const [mistakes, setMistakes] = useState(0);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);

  useEffect(() => {
    const prev = getModeResult("duality", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const failed = mistakes >= DUALITY_MAX_MISTAKES;
  const solved = found.length === day.pairs.length;
  const done = failed || solved;
  const score = found.length * DUALITY_POINTS_PER_PAIR;
  const max = day.pairs.length * DUALITY_POINTS_PER_PAIR;

  const remaining = board.filter((d) => !found.includes(d.pair));

  const toggle = (text: string) => {
    if (done) return;
    setSelected((s) =>
      s.includes(text) ? s.filter((t) => t !== text) : s.length < 2 ? [...s, text] : s
    );
  };

  const submit = () => {
    if (selected.length !== 2 || done) return;
    const picked = selected.map((t) => board.find((d) => d.text === t)!);
    if (picked[0].pair === picked[1].pair) {
      setFound((f) => [...f, picked[0].pair]);
      setSelected([]);
      feedbackCorrect();
    } else {
      setMistakes((m) => m + 1);
      setSelected([]);
      feedbackWrong();
    }
  };

  // Persist once finished.
  useEffect(() => {
    if (!done) return;
    if (getModeResult("duality", date)) return;
    saveModeResult("duality", date, {
      score,
      maxScore: max,
      detail: [found.length, mistakes],
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "duality", score }),
    }).catch(() => {});
  }, [done, score, max, date, found.length, mistakes]);

  if (already) {
    return (
      <GameShell mode="duality" date={date}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Already played</p>
          <p className="mt-3 font-condensed text-6xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-3xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mb-6 mt-2 text-sm text-ink-secondary">Four new pairs tomorrow.</p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="duality" />
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell mode="duality" date={date}>
      <p className="text-center text-xs font-semibold text-ink-secondary">
        Match the pairs - two meanings, one word
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {/* matched pairs collapse into colored banners revealing the word */}
        {found.map((pairIdx, order) => (
          <motion.div
            key={pairIdx}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl px-4 py-3 text-center"
            style={{ background: PAIR_COLORS[order], color: PAIR_INK[order] }}
          >
            <p className="font-condensed text-2xl font-semibold uppercase tracking-wide leading-none">
              {day.pairs[pairIdx].word}
            </p>
            <p className="mt-1 text-[11px] font-bold opacity-80">
              {day.pairs[pairIdx].defs.join("  ·  ")}
            </p>
          </motion.div>
        ))}

        {/* the board */}
        {remaining.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {remaining.map((d) => {
              const isSel = selected.includes(d.text);
              return (
                <button
                  key={d.text}
                  onClick={() => toggle(d.text)}
                  className={`flex min-h-[4.4rem] items-center justify-center rounded-xl px-3 py-3 text-center text-[13px] font-bold leading-snug transition-all active:scale-95 sm:text-sm ${
                    isSel ? "bg-cta text-background" : "bg-surface text-ink"
                  }`}
                >
                  {d.text}
                </button>
              );
            })}
          </div>
        )}

        {/* failed: reveal what was left */}
        {failed &&
          day.pairs.map((p, pairIdx) =>
            found.includes(pairIdx) ? null : (
              <div
                key={p.word}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-center"
              >
                <p className="font-condensed text-2xl font-semibold uppercase tracking-wide leading-none text-ink-secondary">
                  {p.word}
                </p>
                <p className="mt-1 text-[11px] font-bold text-ink-secondary opacity-80">
                  {p.defs.join("  ·  ")}
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
            <span className="flex items-center gap-1.5">
              {Array.from({ length: DUALITY_MAX_MISTAKES }).map((_, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: i < DUALITY_MAX_MISTAKES - mistakes ? ACCENT : "rgb(var(--border))",
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
          <NextGameCTA date={date} current="duality" />
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
            <Button size="lg" className="w-full" onClick={submit} disabled={selected.length !== 2}>
              {selected.length === 2 ? "Lock it in" : `Pick ${2 - selected.length} more`}
            </Button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
