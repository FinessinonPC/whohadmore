"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { isAdminPreview } from "@/lib/adminClient";
import { useModeGuard } from "@/hooks/useModeGuard";
import { DUALITY_MAX_MISTAKES, DUALITY_MAX_SCORE, DUALITY_PAIRS, dualityScore, modeDef } from "@/lib/modes";
import { hashSeed, mulberry32, seededShuffle } from "@/lib/seed";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import type { DualityDay } from "@/lib/contentPacks";

const ACCENT = modeDef("duality").accent;
// Difficulty colors for matched pairs, easy -> hard (the familiar scheme).
const PAIR_COLORS = ["#FFC400", "#00C853", "#2E6BFF", "#A44BFF"];
const PAIR_INK = ["#0B0D10", "#0B0D10", "#FFFFFF", "#FFFFFF"];

/** Order-independent key for a pair of definitions, so a combo counts once. */
const comboKey = (a: string, b: string) => [a, b].sort().join("|||");

/**
 * Duality: eight definitions hide four pairs - each pair is two meanings of
 * the SAME word. Tap two that go together; matched pairs collapse into
 * difficulty-colored banners that reveal the word. Three wrong lock-ins ends
 * it, each one costs points, and a combo can't be tried twice. Max 1000.
 * Content resolves server-side and arrives as a prop.
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
  const [tried, setTried] = useState<Set<string>>(new Set()); // wrong combos already used
  const [shake, setShake] = useState<string[]>([]); // texts currently shaking (wrong)
  const [elapsed, setElapsed] = useState(0); // seconds, frozen at finish
  const startRef = useRef<number | null>(null); // clock starts on first pick
  const { already, checking } = useModeGuard("duality", date, DUALITY_MAX_SCORE);

  const failed = mistakes >= DUALITY_MAX_MISTAKES;
  const solved = found.length === day.pairs.length;
  const done = failed || solved;
  const score = dualityScore(found.length, mistakes, elapsed);
  const max = DUALITY_MAX_SCORE;

  const secondsNow = () => (startRef.current ? (Date.now() - startRef.current) / 1000 : 0);

  const currentKey = selected.length === 2 ? comboKey(selected[0], selected[1]) : null;
  const isRepeat = currentKey ? tried.has(currentKey) : false;

  const remaining = board.filter((d) => !found.includes(d.pair));

  const toggle = (text: string) => {
    if (done || shake.length > 0) return;
    if (startRef.current === null) startRef.current = Date.now();
    setSelected((s) =>
      s.includes(text) ? s.filter((t) => t !== text) : s.length < 2 ? [...s, text] : s
    );
  };

  const submit = () => {
    if (selected.length !== 2 || done || shake.length > 0) return;
    const key = comboKey(selected[0], selected[1]);
    if (tried.has(key)) return; // no submitting the same combo twice
    const picked = selected.map((t) => board.find((d) => d.text === t)!);
    if (picked[0].pair === picked[1].pair) {
      // Freeze the clock the instant the last pair lands, so the persisted
      // score uses the real solve time (not a stale render value).
      if (found.length + 1 >= DUALITY_PAIRS) setElapsed(secondsNow());
      setFound((f) => [...f, picked[0].pair]);
      setSelected([]);
      feedbackCorrect();
    } else {
      if (mistakes + 1 >= DUALITY_MAX_MISTAKES) setElapsed(secondsNow());
      setMistakes((m) => m + 1);
      setTried((t) => new Set(t).add(key));
      setShake(selected); // shake the two wrong tiles, then clear them
      feedbackWrong();
      window.setTimeout(() => {
        setShake([]);
        setSelected([]);
      }, 450);
    }
  };

  // Persist once finished.
  useEffect(() => {
    if (!done) return;
    if (isAdminPreview()) return; // don't record admin previews
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
      body: JSON.stringify({
        session_id: getSessionId(),
        play_date: date,
        mode: "duality",
        score,
        clean: solved && mistakes === 0,
      }),
    }).catch(() => {});
  }, [done, score, max, date, found.length, mistakes, solved]);

  if (checking) {
    return (
      <GameShell mode="duality" date={date}>
        <div className="min-h-[40vh]" aria-hidden />
      </GameShell>
    );
  }

  if (already) {
    // The finished puzzle, there to admire: all four pairs revealed, plus
    // the score this player banked.
    return (
      <GameShell mode="duality" date={date}>
        <p className="text-center text-xs font-semibold text-ink-secondary">
          You played this one - here are the answers
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {day.pairs.map((p, order) => (
            <div
              key={p.word}
              className="rounded-xl px-4 py-3 text-center"
              style={{ background: PAIR_COLORS[order], color: PAIR_INK[order] }}
            >
              <p className="font-condensed text-2xl font-semibold uppercase tracking-wide leading-none">
                {p.word}
              </p>
              <p className="mt-1 text-[11px] font-bold opacity-80">{p.defs.join("  ·  ")}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 text-center">
          <p className="font-condensed text-5xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-2xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-secondary">Four new pairs tomorrow.</p>
        </div>
        <div className="mt-auto pb-1 pt-5">
          <NextGameCTA date={date} current="duality" />
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
              const isShaking = shake.includes(d.text);
              return (
                <motion.button
                  key={d.text}
                  onClick={() => toggle(d.text)}
                  animate={isShaking ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                  transition={isShaking ? { duration: 0.42 } : { duration: 0 }}
                  className={`flex min-h-[4.4rem] items-center justify-center rounded-xl px-3 py-3 text-center text-[13px] font-bold leading-snug transition-colors active:scale-95 sm:text-sm ${
                    isShaking
                      ? "text-white"
                      : isSel
                        ? "bg-cta text-background"
                        : "bg-surface text-ink"
                  }`}
                  style={isShaking ? { background: "#FF3B30" } : undefined}
                >
                  {d.text}
                </motion.button>
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
            {solved && mistakes === 0 ? `Perfect · +${score}` : `+${score}`}
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
              disabled={selected.length === 0 || shake.length > 0}
            >
              Clear
            </Button>
            <Button
              size="lg"
              className="w-full"
              onClick={submit}
              disabled={selected.length !== 2 || isRepeat || shake.length > 0}
            >
              {selected.length !== 2
                ? `Pick ${2 - selected.length} more`
                : isRepeat
                  ? "Already tried"
                  : "Lock it in"}
            </Button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
