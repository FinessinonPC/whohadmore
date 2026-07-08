"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { MINI_MAX_POINTS, miniScore, modeDef } from "@/lib/modes";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import type { MiniClue, MiniDay } from "@/lib/contentPacks";

const ACCENT = modeDef("mini").accent;
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

type Dir = "A" | "D";

/**
 * Mini: a 5x5 crossword. Fill the grid, check when full - each failed check
 * costs points; revealing scores zero. One puzzle per day for everyone.
 */
export function MiniGame({ day, date }: { day: MiniDay; date: string }) {
  const rows = day.rows;
  const open = useCallback(
    (r: number, c: number) => r >= 0 && r < 5 && c >= 0 && c < 5 && rows[r][c] !== "#",
    [rows]
  );

  const numberAt = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of [...day.across, ...day.down]) {
      const k = `${s.row},${s.col}`;
      if (!m.has(k)) m.set(k, s.num);
    }
    return m;
  }, [day]);

  const [entries, setEntries] = useState<string[][]>(() =>
    Array.from({ length: 5 }, () => Array(5).fill(""))
  );
  const [active, setActive] = useState<{ r: number; c: number }>(() => {
    const s = day.across[0];
    return { r: s.row, c: s.col };
  });
  const [dir, setDir] = useState<Dir>("A");
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [right, setRight] = useState<Set<string>>(new Set());
  const [checks, setChecks] = useState(0); // times Check was used - the crutch
  const [wrongNudge, setWrongNudge] = useState(false); // full grid, but not all right
  const [done, setDone] = useState<null | { score: number; revealed: boolean }>(null);
  const [already, setAlready] = useState<{ score: number; max: number } | null>(null);
  const startRef = useRef<number | null>(null); // clock starts on the first letter
  const secondsNow = () => (startRef.current ? (Date.now() - startRef.current) / 1000 : 0);

  useEffect(() => {
    const prev = getModeResult("mini", date);
    if (prev) setAlready({ score: prev.score, max: prev.maxScore });
  }, [date]);

  const slotFor = useCallback(
    (r: number, c: number, d: Dir): MiniClue | undefined =>
      d === "A"
        ? day.across.find((s) => s.row === r && c >= s.col && c < s.col + s.len)
        : day.down.find((s) => s.col === c && r >= s.row && r < s.row + s.len),
    [day]
  );

  const activeSlot = slotFor(active.r, active.c, dir) ?? slotFor(active.r, active.c, dir === "A" ? "D" : "A");
  const slotOrder: { slot: MiniClue; d: Dir }[] = useMemo(
    () => [
      ...day.across.map((slot) => ({ slot, d: "A" as Dir })),
      ...day.down.map((slot) => ({ slot, d: "D" as Dir })),
    ],
    [day]
  );

  const inActiveSlot = (r: number, c: number) => {
    if (!activeSlot) return false;
    const d = dir;
    return d === "A"
      ? r === activeSlot.row && c >= activeSlot.col && c < activeSlot.col + activeSlot.len
      : c === activeSlot.col && r >= activeSlot.row && r < activeSlot.row + activeSlot.len;
  };

  const gotoSlot = (offset: number) => {
    const idx = slotOrder.findIndex((x) => x.d === dir && x.slot.num === activeSlot?.num);
    const next = slotOrder[(idx + offset + slotOrder.length) % slotOrder.length];
    setDir(next.d);
    setActive({ r: next.slot.row, c: next.slot.col });
  };

  const clearMarks = (r: number, c: number) => {
    const strip = (prev: Set<string>) => {
      const n = new Set(prev);
      n.delete(`${r},${c}`);
      return n;
    };
    setWrong(strip);
    setRight(strip);
  };

  const type = useCallback(
    (key: string) => {
      if (done || already) return;
      const { r, c } = active;
      if (key === "BACK") {
        clearMarks(r, c);
        if (entries[r][c]) {
          setEntries((e) => e.map((row, ri) => row.map((ch, ci) => (ri === r && ci === c ? "" : ch))));
        } else {
          const pr = dir === "A" ? r : r - 1;
          const pc = dir === "A" ? c - 1 : c;
          if (open(pr, pc)) {
            setActive({ r: pr, c: pc });
            clearMarks(pr, pc);
            setEntries((e) => e.map((row, ri) => row.map((ch, ci) => (ri === pr && ci === pc ? "" : ch))));
          }
        }
        return;
      }
      if (!/^[A-Z]$/.test(key)) return;
      if (startRef.current === null) startRef.current = Date.now();
      setEntries((e) => e.map((row, ri) => row.map((ch, ci) => (ri === r && ci === c ? key : ch))));
      clearMarks(r, c);
      const nr = dir === "A" ? r : r + 1;
      const nc = dir === "A" ? c + 1 : c;
      if (open(nr, nc)) setActive({ r: nr, c: nc });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, dir, done, already, entries, open]
  );

  /** Arrow keys walk the grid: moving along the current direction steps to
   *  the next open cell (skipping blacks); pressing across the grain switches
   *  direction first - so ArrowDown flips to the Down clue, NYT-style. */
  const arrow = useCallback(
    (dr: number, dc: number) => {
      if (done || already) return;
      const axis: Dir = dr !== 0 ? "D" : "A";
      if (dir !== axis) {
        setDir(axis);
        return;
      }
      let r = active.r + dr;
      let c = active.c + dc;
      while (r >= 0 && r < 5 && c >= 0 && c < 5) {
        if (open(r, c)) {
          setActive({ r, c });
          return;
        }
        r += dr;
        c += dc;
      }
    },
    [active, dir, done, already, open]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        type("BACK");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        arrow(-1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        arrow(1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        arrow(0, -1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        arrow(0, 1);
      } else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type, arrow]);

  const finish = (score: number, revealed: boolean) => {
    setDone({ score, revealed });
    if (getModeResult("mini", date)) return;
    saveModeResult("mini", date, {
      score,
      maxScore: MINI_MAX_POINTS,
      detail: [checks],
      completedAt: new Date().toISOString(),
    });
    void fetch("/api/modes/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: getSessionId(),
        play_date: date,
        mode: "mini",
        score,
        clean: !revealed && checks === 0,
      }),
    }).catch(() => {});
  };

  const anyFilled = entries.some((row, r) => row.some((ch, c) => open(r, c) && ch !== ""));

  // Auto-complete: the moment every cell is filled AND all correct, the grid
  // finishes on its own - no Check needed. A full-but-wrong grid just nudges
  // "some letters are wrong" (without saying which - that's what Check is for).
  useEffect(() => {
    if (done || already) return;
    let full = true;
    let allRight = true;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        if (!open(r, c)) continue;
        const ch = entries[r][c];
        if (!ch) full = false;
        else if (ch !== rows[r][c]) allRight = false;
      }
    if (full && allRight) {
      feedbackCorrect();
      finish(miniScore(checks, secondsNow()), false);
    } else {
      setWrongNudge(full && !allRight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, done, already, open]);

  // Check is the crutch: it marks which filled letters are right/wrong and
  // costs points, so a checked solve never scores full marks.
  const check = () => {
    if (!anyFilled || done) return;
    const bad = new Set<string>();
    const good = new Set<string>();
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        if (!open(r, c)) continue;
        const ch = entries[r][c];
        if (!ch) continue;
        if (ch === rows[r][c]) good.add(`${r},${c}`);
        else bad.add(`${r},${c}`);
      }
    feedbackWrong();
    setWrong(bad);
    setRight(good);
    setChecks((n) => n + 1);
  };

  const reveal = () => {
    if (done) return;
    setEntries(rows.map((row) => row.split("").map((ch) => (ch === "#" ? "" : ch))));
    setWrong(new Set());
    feedbackWrong();
    finish(0, true);
  };

  if (already && !done) {
    return (
      <GameShell mode="mini" date={date}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="small-caps text-xs text-ink-secondary">Already played</p>
          <p className="mt-3 font-condensed text-6xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-3xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mb-6 mt-2 text-sm text-ink-secondary">A new grid drops tomorrow.</p>
          <div className="w-full max-w-xs">
            <NextGameCTA date={date} current="mini" />
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell mode="mini" date={date}>
      <div className="flex flex-1 flex-col">
        {/* grid */}
        <div className="mx-auto grid w-full max-w-[300px] grid-cols-5 gap-1">
          {rows.map((row, r) =>
            row.split("").map((solutionCh, c) => {
              if (solutionCh === "#")
                return <div key={`${r},${c}`} className="aspect-square rounded-md bg-[#000000]/60 dark:bg-black" />;
              const k = `${r},${c}`;
              const isActive = active.r === r && active.c === c;
              const inWord = inActiveSlot(r, c);
              const num = numberAt.get(k);
              return (
                <button
                  key={k}
                  onClick={() => {
                    if (done) return;
                    if (isActive) setDir((d) => (d === "A" ? "D" : "A"));
                    else {
                      setActive({ r, c });
                      if (!slotFor(r, c, dir)) setDir((d) => (d === "A" ? "D" : "A"));
                    }
                  }}
                  className="relative flex aspect-square items-center justify-center rounded-md font-condensed text-xl font-semibold uppercase transition-colors"
                  style={{
                    background: isActive ? ACCENT : inWord ? `${ACCENT}33` : "rgb(var(--surface))",
                    color: isActive
                      ? "#FFFFFF"
                      : wrong.has(k)
                        ? "#FF3B30"
                        : right.has(k)
                          ? "#00C853"
                          : done && !done.revealed
                            ? "#00C853"
                            : "rgb(var(--ink))",
                  }}
                >
                  {num && (
                    <span
                      className="absolute left-0.5 top-0 text-[8px] font-bold opacity-60"
                      style={{ color: isActive ? "#FFFFFF" : "rgb(var(--ink-2))" }}
                    >
                      {num}
                    </span>
                  )}
                  {entries[r][c]}
                </button>
              );
            })
          )}
        </div>

        {/* full grid but not all correct - nudge without giving it away */}
        <div className="flex h-5 items-center justify-center">
          {wrongNudge && !done && (
            <p className="mt-2 text-xs font-bold" style={{ color: "#FF3B30" }}>
              Some letters are wrong
            </p>
          )}
        </div>

        {/* clue bar / result */}
        {done ? (
          <div className="mt-3 text-center">
            <p className="font-condensed text-4xl font-semibold text-ink tabular">
              {done.revealed ? "Revealed" : `+${done.score}`}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink-secondary">
              {done.revealed
                ? "No points this time - tomorrow's grid awaits"
                : checks === 0
                  ? "Clean solve - no checks used"
                  : `Solved with ${checks} ${checks === 1 ? "check" : "checks"}`}
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-4 flex w-full max-w-[340px] items-stretch gap-1.5">
            <button
              onClick={() => gotoSlot(-1)}
              aria-label="Previous clue"
              className="shrink-0 rounded-xl bg-surface px-3 text-ink-secondary"
            >
              ‹
            </button>
            <button
              onClick={() => setDir((d) => (d === "A" ? "D" : "A"))}
              className="min-h-[3rem] flex-1 rounded-xl px-3 py-2 text-center"
              style={{ background: `${ACCENT}1E` }}
            >
              <span className="text-[13px] font-bold leading-snug text-ink">
                <span style={{ color: ACCENT }} className="mr-1.5 font-condensed">
                  {activeSlot?.num}
                  {dir}
                </span>
                {activeSlot?.clue}
              </span>
            </button>
            <button
              onClick={() => gotoSlot(1)}
              aria-label="Next clue"
              className="shrink-0 rounded-xl bg-surface px-3 text-ink-secondary"
            >
              ›
            </button>
          </div>
        )}

        {/* keyboard / actions */}
        <div className="mt-auto pb-1 pt-4">
          {done ? (
            <NextGameCTA date={date} current="mini" />
          ) : (
            <div className="mx-auto flex w-full max-w-[430px] flex-col gap-1.5">
              {KEY_ROWS.map((row, i) => (
                <div key={i} className="flex justify-center gap-1.5">
                  {row.split("").map((k) => (
                    <button
                      key={k}
                      onClick={() => type(k)}
                      className="flex h-11 flex-1 items-center justify-center rounded-lg bg-surface text-sm font-extrabold text-ink active:scale-95"
                    >
                      {k}
                    </button>
                  ))}
                  {i === 2 && (
                    <button
                      onClick={() => type("BACK")}
                      aria-label="Delete"
                      className="flex h-11 flex-[1.6] items-center justify-center rounded-lg bg-surface text-base font-extrabold text-ink active:scale-95"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              ))}
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  onClick={reveal}
                  className="shrink-0 rounded-2xl px-4 py-3 text-xs font-bold text-ink-secondary transition-colors hover:text-ink"
                >
                  Reveal
                </button>
                <Button size="lg" className="w-full" onClick={check} disabled={!anyFilled}>
                  {!anyFilled
                    ? "Type letters to check"
                    : checks > 0
                      ? "Check again"
                      : "Check letters"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}
