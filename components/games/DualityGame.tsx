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
const PASTEL = modeDef("duality").pastel;
// Difficulty colors for matched pairs, easy -> hard: the familiar scheme,
// mixed as chalky pastels so ink stays legible on every banner.
const PAIR_COLORS = ["#F7E38C", "#B5DB8B", "#AECBF3", "#D5B8EE"];
const PAIR_INK = ["#16181D", "#16181D", "#16181D", "#16181D"];

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

  // Toss each tile at a small fixed angle/offset (seeded, so it's stable across
  // renders) - the eight should read as one scattered pile, never two tidy
  // columns you'd pick one-from-each.
  const jitter = useMemo(() => {
    const m = new Map<string, { rot: number; dx: number; dy: number }>();
    for (const d of board) {
      const rnd = mulberry32(hashSeed(`duality:${date}:jit:${d.text}`));
      m.set(d.text, {
        rot: (rnd() * 2 - 1) * 3, // -3deg..3deg
        dx: (rnd() * 2 - 1) * 4,
        dy: (rnd() * 2 - 1) * 7,
      });
    }
    return m;
  }, [board, date]);

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
      seconds: Math.round(elapsed),
      moves: mistakes,
      won: solved,
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
        seconds: Math.round(elapsed),
        moves: mistakes, // wrong lock-ins - drives the profile's avg mistakes
        won: solved,
      }),
    }).catch(() => {});
  }, [done, score, max, date, found.length, mistakes, solved, elapsed]);

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
              className={`ink-fix ink-shadow-sm wonky border-[3px] border-ink px-4 py-3 text-center ${order % 2 === 0 ? "tilt-l" : "tilt-r"}`}
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
            className={`ink-fix ink-shadow-sm wonky border-[3px] border-ink px-4 py-3 text-center ${order % 2 === 0 ? "tilt-l" : "tilt-r"}`}
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

        {/* the board - one scattered POOL of eight. Tiles are tossed at slight
            angles and offsets so there's no clean left/right edge to read as
            "one from each side"; any two can pair. */}
        {remaining.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 py-1">
            {remaining.map((d) => {
              const isSel = selected.includes(d.text);
              const isShaking = shake.includes(d.text);
              const j = jitter.get(d.text) ?? { rot: 0, dx: 0, dy: 0 };
              return (
                <div
                  key={d.text}
                  style={{ transform: `translate(${j.dx}px, ${j.dy}px) rotate(${j.rot}deg)` }}
                >
                  <motion.button
                    onClick={() => toggle(d.text)}
                    animate={isShaking ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0, scale: isSel ? 1.04 : 1 }}
                    transition={isShaking ? { duration: 0.42 } : { type: "spring", stiffness: 500, damping: 30 }}
                    className={`ink-fix wonky flex min-h-[4.8rem] w-full items-center justify-center border-2 border-ink px-3 py-3 text-center text-sm font-bold leading-snug transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-[15px] ${
                      isSel ? "ink-shadow" : "ink-shadow-sm"
                    } ${isShaking ? "" : isSel ? "" : "text-ink"}`}
                    // Inline wins over the ink-fix utility: selected tiles read
                    // cream-on-black (black = legible), ringed cyan so they pop
                    // on the dark theme too, where a black fill would vanish.
                    style={
                      isShaking
                        ? { background: "#FF3B30", color: "#FFFFFF" }
                        : isSel
                          ? { background: "#16181D", color: "#FFF9E8", borderColor: "#06B6D4" }
                          : { background: PASTEL }
                    }
                  >
                    {d.text}
                  </motion.button>
                </div>
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
                className="card-ink-flat px-4 py-3 text-center"
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
