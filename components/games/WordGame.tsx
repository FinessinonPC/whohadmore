"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { isAdminPreview } from "@/lib/adminClient";
import { useModeGuard } from "@/hooks/useModeGuard";
import { WORD_MAX_GUESSES, WORD_POINTS, wordLossScore, modeDef } from "@/lib/modes";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import { isValidWord } from "@/lib/wordList";

// Verdict colors as chalky pastels - ink writes on them like everything else.
const GREEN = "#A9DC95"; // placed right
const YELLOW = modeDef("word").pastel; // in the word, wrong spot
const INK = "#16181D";

type Mark = "g" | "y" | "x";

/** Standard two-pass evaluation (handles duplicate letters correctly). */
function evaluate(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(guess.length).fill("x");
  const remaining: Record<string, number> = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) marks[i] = "g";
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === "g") continue;
    const ch = guess[i];
    if (remaining[ch] > 0) {
      marks[i] = "y";
      remaining[ch]--;
    }
  }
  return marks;
}

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

/**
 * Word: the daily five-letter game everyone already knows - six tries,
 * green/yellow feedback, one word per day for every player. The answer
 * resolves server-side (custom admin day, else the pack).
 */
export function WordGame({ answer, date }: { answer: string; date: string }) {

  const [rows, setRows] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { already, checking } = useModeGuard("word", date, WORD_POINTS[0]);

  const won = rows[rows.length - 1] === answer;
  const done = won || rows.length >= WORD_MAX_GUESSES;
  // A loss still pays for the letters you proved green - partial credit.
  const score = won ? WORD_POINTS[rows.length - 1] : done ? wordLossScore(rows, answer) : 0;

  // Hold the result + CTA until the last row finishes its flip reveal.
  const [revealDone, setRevealDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setRevealDone(true), 5 * 260 + 480);
    return () => window.clearTimeout(t);
  }, [done]);

  // Best state per key for the keyboard coloring.
  const keyState: Record<string, Mark> = {};
  for (const row of rows) {
    const marks = evaluate(row, answer);
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      const m = marks[i];
      const prev = keyState[ch];
      if (m === "g" || (m === "y" && prev !== "g") || (m === "x" && !prev)) keyState[ch] = m;
    }
  }

  const type = useCallback(
    (key: string) => {
      if (done || already) return;
      if (key === "ENTER") {
        if (current.length !== 5) {
          setShake(true);
          window.setTimeout(() => setShake(false), 350);
          return;
        }
        if (!isValidWord(current)) {
          setShake(true);
          setToast("Not in word list");
          window.setTimeout(() => setShake(false), 350);
          window.setTimeout(() => setToast(null), 1200);
          return;
        }
        const next = [...rows, current];
        setRows(next);
        setCurrent("");
        if (current === answer) feedbackCorrect();
        else if (next.length >= WORD_MAX_GUESSES) feedbackWrong();
        return;
      }
      if (key === "BACK") {
        setCurrent((c) => c.slice(0, -1));
        return;
      }
      if (/^[A-Z]$/.test(key) && current.length < 5) setCurrent((c) => c + key);
    },
    [current, rows, done, already, answer]
  );

  // Physical keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") type("ENTER");
      else if (e.key === "Backspace") type("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type]);

  // Persist once finished.
  useEffect(() => {
    if (!done || rows.length === 0) return;
    if (isAdminPreview()) return; // don't record admin previews
    if (getModeResult("word", date)) return;
    saveModeResult("word", date, {
      score,
      maxScore: WORD_POINTS[0],
      detail: [rows.length],
      completedAt: new Date().toISOString(),
      state: { rows }, // the finished board, for the come-back-and-admire view
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: getSessionId(), play_date: date, mode: "word", score }),
    }).catch(() => {});
  }, [done, rows.length, score, date]);

  const tileStyle = (m: Mark | null): React.CSSProperties => {
    if (m === "g") return { background: GREEN, borderColor: INK, color: INK };
    if (m === "y") return { background: YELLOW, borderColor: INK, color: INK };
    if (m === "x") return { background: "rgb(var(--border))", borderColor: "rgb(var(--border))", opacity: 0.75 };
    return {};
  };

  if (checking) {
    return (
      <GameShell mode="word" date={date}>
        <div className="min-h-[40vh]" aria-hidden />
      </GameShell>
    );
  }

  if (already) {
    // The finished board, there to admire. Guesses live in the local result's
    // state; a cross-device return (no local state) still shows the answer.
    const savedRows =
      ((getModeResult("word", date)?.state as { rows?: string[] } | undefined)?.rows ?? []).filter(
        (r) => typeof r === "string" && r.length === 5
      );
    return (
      <GameShell mode="word" date={date} endShare={{ game: "word", date }}>
        <p className="text-center text-xs font-semibold text-ink-secondary">
          You played this one - here&apos;s how it went
        </p>
        {savedRows.length > 0 ? (
          <div className="mx-auto mt-4 grid w-full max-w-[280px] gap-1.5">
            {savedRows.map((row, r) => {
              const marks = evaluate(row, answer);
              return (
                <div key={r} className="grid grid-cols-5 gap-1.5">
                  {row.split("").map((ch, c) => (
                    <div
                      key={c}
                      className="flex aspect-square items-center justify-center rounded-lg border-2 border-ink/30 font-condensed text-xl font-semibold uppercase text-ink"
                      style={tileStyle(marks[c])}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 text-center font-condensed text-4xl font-semibold uppercase tracking-wide text-ink">
            {answer}
          </p>
        )}
        <div className="mt-5 text-center">
          <p className="font-condensed text-5xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-2xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-secondary">A new word drops tomorrow.</p>
        </div>
        <div className="mt-auto pb-1 pt-5">
          <NextGameCTA date={date} current="word" />
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell mode="word" date={date} endShare={revealDone ? { game: "word", date } : undefined}>
      <div className="flex flex-1 flex-col">
        {/* board */}
        <motion.div
          animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.32 }}
          className="mx-auto mt-2 grid w-full max-w-[320px] grid-rows-6 gap-1.5"
        >
          {Array.from({ length: WORD_MAX_GUESSES }).map((_, r) => {
            const submitted = rows[r];
            const activeRow = r === rows.length && !done;
            const marks = submitted ? evaluate(submitted, answer) : null;
            // Only the freshest guess flips; older rows sit revealed. The key
            // swap on submit remounts the row so the animation starts clean.
            const animateRow = Boolean(submitted) && r === rows.length - 1;
            return (
              <div key={`${r}-${submitted ? "s" : "e"}`} className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 5 }).map((_, c) => {
                  if (submitted && marks) {
                    return (
                      <FlipTile
                        key={c}
                        ch={submitted[c]}
                        delayMs={c * 260}
                        animate={animateRow}
                        revealedStyle={tileStyle(marks[c])}
                      />
                    );
                  }
                  const ch = activeRow ? current[c] : undefined;
                  return (
                    <div
                      key={c}
                      className="flex aspect-square items-center justify-center rounded-lg border-2 border-ink/30 font-condensed text-2xl font-semibold uppercase text-ink"
                      style={ch ? { borderColor: "rgb(var(--ink-2))" } : {}}
                    >
                      {ch ?? ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </motion.div>

        {/* result line - waits for the last row's flip to land */}
        <div className="mt-4 flex h-16 flex-col items-center justify-center text-center">
          {revealDone ? (
            <>
              <p className="font-condensed text-3xl font-semibold uppercase tracking-wide text-ink">
                {won ? `+${score}` : answer}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-ink-secondary">
                {won
                  ? `Got it in ${rows.length}`
                  : score > 0
                    ? `Out of tries · +${score} for the greens you locked in`
                    : "Out of tries - tomorrow's word awaits"}
              </p>
            </>
          ) : done ? null : toast ? (
            <p className="text-xs font-bold text-wrong">{toast}</p>
          ) : (
            <p className="text-xs font-semibold text-ink-secondary">
              Guess the five-letter word · {WORD_MAX_GUESSES - rows.length} tries left
            </p>
          )}
        </div>

        {/* keyboard / next */}
        <div className="mt-auto pb-1">
          {revealDone ? (
            <NextGameCTA date={date} current="word" />
          ) : (
            <div className="mx-auto flex w-full max-w-[430px] flex-col gap-1.5">
              {KEY_ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5">
                  {i === 2 && (
                    <button
                      onClick={() => type("ENTER")}
                      className="flex h-12 flex-[1.6] items-center justify-center rounded-lg border-2 border-ink bg-cta text-[11px] font-extrabold text-background active:scale-95"
                    >
                      ENTER
                    </button>
                  )}
                  {row.split("").map((k) => {
                    const st = keyState[k];
                    return (
                      <button
                        key={k}
                        onClick={() => type(k)}
                        className="card-ink-flat flex h-12 flex-1 items-center justify-center rounded-lg text-sm font-extrabold text-ink active:scale-95"
                        style={
                          st === "g"
                            ? { background: GREEN, borderColor: INK, color: INK }
                            : st === "y"
                              ? { background: YELLOW, borderColor: INK, color: INK }
                              : st === "x"
                                ? { opacity: 0.35 }
                                : {}
                        }
                      >
                        {k}
                      </button>
                    );
                  })}
                  {i === 2 && (
                    <button
                      onClick={() => type("BACK")}
                      aria-label="Delete"
                      className="card-ink-flat flex h-12 flex-[1.6] items-center justify-center rounded-lg text-base font-extrabold text-ink active:scale-95"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}

/**
 * A submitted tile that flips like the original: rotates to edge-on, swaps to
 * its verdict color at the midpoint, and rotates back - staggered per column.
 */
function FlipTile({
  ch,
  delayMs,
  animate,
  revealedStyle,
}: {
  ch: string;
  delayMs: number;
  animate: boolean;
  revealedStyle: React.CSSProperties;
}) {
  const [shown, setShown] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(() => setShown(true), delayMs + 260);
    return () => window.clearTimeout(t);
  }, [animate, delayMs]);

  return (
    <motion.div
      initial={false}
      animate={animate ? { rotateX: [0, 90, 0] } : { rotateX: 0 }}
      transition={
        animate
          ? { duration: 0.52, delay: delayMs / 1000, times: [0, 0.5, 1], ease: "easeInOut" }
          : undefined
      }
      className="flex aspect-square items-center justify-center rounded-lg border-2 border-ink/30 font-condensed text-2xl font-semibold uppercase text-ink"
      style={shown ? revealedStyle : {}}
    >
      {ch}
    </motion.div>
  );
}
