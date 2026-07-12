"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameShell, NextGameCTA } from "./GameShell";
import { getSessionId } from "@/lib/playStore";
import { getModeResult, saveModeResult } from "@/lib/modeStore";
import { isAdminPreview } from "@/lib/adminClient";
import { useModeGuard } from "@/hooks/useModeGuard";
import { MINI_MAX_POINTS, MINI_REVEAL_CREDIT, miniScore, modeDef } from "@/lib/modes";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import type { MiniClue, MiniDay } from "@/lib/contentPacks";

const ACCENT = modeDef("mini").accent; // clue numbers
// Selection as pastel periwinkle - the pen stays ink, the paper blushes.
const SELECT = "#AFBBF3"; // the focused cell
const WASH = "#DFE4FB"; // the rest of the active word
const LOCKED_BG = "rgba(31, 158, 75, 0.16)"; // soft green wash on locked-correct cells
const PASTEL = modeDef("mini").pastel; // the clue bar's card face
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
  // Cells confirmed correct by a Check are LOCKED - permanent, uneditable, and
  // the cursor skips over them as you type.
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [checks, setChecks] = useState(0); // times Check was used - the crutch
  const [wrongNudge, setWrongNudge] = useState(false); // full grid, but not all right
  const [done, setDone] = useState<null | { score: number; revealed: boolean; seconds: number }>(null);
  const [, tick] = useState(0); // drives the live clock re-render
  const startRef = useRef<number | null>(null); // clock starts on game entry
  const secondsNow = () => (startRef.current ? (Date.now() - startRef.current) / 1000 : 0);
  const { already, checking } = useModeGuard("mini", date, MINI_MAX_POINTS);

  // The clock starts the moment the player lands on the puzzle.
  useEffect(() => {
    if (startRef.current === null) startRef.current = Date.now();
  }, []);

  // Tick the visible clock once a second while the puzzle is live.
  useEffect(() => {
    if (done || already) return;
    const id = window.setInterval(() => tick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [done, already]);

  const shownSeconds = done ? done.seconds : Math.floor(secondsNow());
  const clock = `${Math.floor(shownSeconds / 60)}:${String(Math.floor(shownSeconds) % 60).padStart(2, "0")}`;

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

  /** True once every cell in this slot has a letter - drives the clue strike-through. */
  const isSlotFilled = useCallback(
    (slot: MiniClue, d: Dir): boolean => {
      for (let i = 0; i < slot.len; i++) {
        const r = d === "A" ? slot.row : slot.row + i;
        const c = d === "A" ? slot.col + i : slot.col;
        if (!entries[r][c]) return false;
      }
      return true;
    },
    [entries]
  );

  /** Enter: jump to the next clue, skipping any that are already fully filled -
   *  same idea as Wordle's Enter, adapted to "move on" instead of "submit". */
  const gotoNextUnfilled = useCallback(() => {
    const idx = slotOrder.findIndex((x) => x.d === dir && x.slot.num === activeSlot?.num);
    if (idx === -1) return;
    for (let step = 1; step <= slotOrder.length; step++) {
      const next = slotOrder[(idx + step) % slotOrder.length];
      if (!isSlotFilled(next.slot, next.d)) {
        setDir(next.d);
        setActive({ r: next.slot.row, c: next.slot.col });
        return;
      }
    }
  }, [slotOrder, dir, activeSlot, isSlotFilled]);

  // Editing a cell clears only its red "wrong" mark; locked-correct cells are
  // never touched (they can't be edited in the first place).
  const clearMarks = (r: number, c: number) => {
    setWrong((prev) => {
      const n = new Set(prev);
      n.delete(`${r},${c}`);
      return n;
    });
  };

  const write = (r: number, c: number, ch: string) =>
    setEntries((e) => e.map((row, ri) => row.map((cur, ci) => (ri === r && ci === c ? ch : cur))));

  const type = useCallback(
    (key: string) => {
      if (done || already) return;
      const { r, c } = active;
      const isLocked = (rr: number, cc: number) => locked.has(`${rr},${cc}`);
      const step = (rr: number, cc: number, back = false): [number, number] =>
        dir === "A" ? [rr, cc + (back ? -1 : 1)] : [rr + (back ? -1 : 1), cc];

      if (key === "BACK") {
        // Delete this cell if it's an editable letter; otherwise walk back to the
        // previous editable (unlocked) cell and clear that, skipping locked ones.
        if (open(r, c) && !isLocked(r, c) && entries[r][c]) {
          write(r, c, "");
          clearMarks(r, c);
          return;
        }
        let [pr, pc] = step(r, c, true);
        while (open(pr, pc) && isLocked(pr, pc)) [pr, pc] = step(pr, pc, true);
        if (open(pr, pc)) {
          setActive({ r: pr, c: pc });
          write(pr, pc, "");
          clearMarks(pr, pc);
        }
        return;
      }

      if (!/^[A-Z]$/.test(key)) return;
      // Land on the first editable cell at or ahead of the cursor (skip locked).
      let tr = r;
      let tc = c;
      while (open(tr, tc) && isLocked(tr, tc)) [tr, tc] = step(tr, tc);
      if (!open(tr, tc)) return;
      write(tr, tc, key);
      clearMarks(tr, tc);
      // Advance to the next editable cell, skipping locked-correct ones.
      let [nr, nc] = step(tr, tc);
      while (open(nr, nc) && isLocked(nr, nc)) [nr, nc] = step(nr, nc);
      if (open(nr, nc)) setActive({ r: nr, c: nc });
      else if (tr !== r || tc !== c) setActive({ r: tr, c: tc });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, dir, done, already, entries, open, locked]
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
      if (e.key === "Enter") {
        e.preventDefault();
        gotoNextUnfilled();
      } else if (e.key === "Backspace") {
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
  }, [type, arrow, gotoNextUnfilled]);

  const finish = (score: number, revealed: boolean, seconds: number) => {
    setDone({ score, revealed, seconds: Math.floor(seconds) });
    if (isAdminPreview()) return; // don't record admin previews
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
      const seconds = secondsNow();
      feedbackCorrect();
      finish(miniScore(checks, seconds), false, seconds);
    } else {
      setWrongNudge(full && !allRight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, done, already, open]);

  // Check is the crutch: it marks which filled letters are wrong (red) and
  // LOCKS the ones that are right (they turn green and can't be edited), then
  // costs a point - so a checked solve never scores full marks.
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
    if (bad.size === 0) feedbackCorrect();
    else feedbackWrong();
    setWrong(bad);
    setLocked((prev) => new Set([...prev, ...good]));
    setChecks((n) => n + 1);
  };

  const reveal = () => {
    if (done) return;
    // Partial credit for the letters that were already right before revealing -
    // giving up with 80% of the grid correct shouldn't score the same as
    // giving up blank. Scaled to always land below a real solve.
    let openCells = 0;
    let correct = 0;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        if (!open(r, c)) continue;
        openCells += 1;
        if (entries[r][c] === rows[r][c]) correct += 1;
      }
    const partial = openCells > 0 ? Math.round(MINI_REVEAL_CREDIT * (correct / openCells)) : 0;
    setEntries(rows.map((row) => row.split("").map((ch) => (ch === "#" ? "" : ch))));
    setWrong(new Set());
    feedbackWrong();
    finish(partial, true, secondsNow());
  };

  if (checking && !done) {
    return (
      <GameShell mode="mini" date={date}>
        <div className="min-h-[40vh]" aria-hidden />
      </GameShell>
    );
  }

  if (already && !done) {
    // The solved grid, there to admire, plus the score this player banked.
    return (
      <GameShell mode="mini" date={date}>
        <p className="text-center text-xs font-semibold text-ink-secondary">
          You played this one - here&apos;s the finished grid
        </p>
        <div className="mx-auto mt-4 grid w-full max-w-[300px] grid-cols-5 gap-1">
          {rows.map((row, r) =>
            row.split("").map((ch, c) => {
              if (ch === "#")
                return <div key={`${r},${c}`} className="aspect-square rounded-md bg-[#16181D]" />;
              const num = numberAt.get(`${r},${c}`);
              return (
                <div
                  key={`${r},${c}`}
                  className="relative flex aspect-square items-center justify-center rounded-md border-[1.5px] border-ink/50 bg-surface font-condensed text-xl font-semibold uppercase"
                  style={{ color: "#00C853" }}
                >
                  {num && (
                    <span className="absolute left-0.5 top-0 text-[8px] font-bold text-ink-secondary opacity-60">
                      {num}
                    </span>
                  )}
                  {ch}
                </div>
              );
            })
          )}
        </div>
        <div className="mt-5 text-center">
          <p className="font-condensed text-5xl font-semibold text-ink tabular">
            {already.score}
            <span className="text-2xl text-ink-secondary"> / {already.max}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-secondary">A new grid drops tomorrow.</p>
        </div>
        <div className="mt-auto pb-1 pt-5">
          <NextGameCTA date={date} current="mini" />
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell mode="mini" date={date} wide>
      <div className="flex flex-1 flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-10">
        {/* LEFT: timer, grid, and play controls */}
        <div className="flex w-full flex-1 flex-col lg:max-w-[460px]">
        {/* live timer - solving faster scores more */}
        <div className="mx-auto mb-2 flex w-full max-w-[300px] items-center justify-between lg:max-w-[460px]">
          <span className="small-caps text-[11px] text-ink-secondary">Speed counts</span>
          <span
            className="font-condensed text-lg font-semibold tabular text-ink"
            aria-label="elapsed time"
          >
            {clock}
          </span>
        </div>

        {/* grid */}
        <div className="mx-auto grid w-full max-w-[300px] grid-cols-5 gap-1 lg:max-w-[460px] lg:gap-2">
          {rows.map((row, r) =>
            row.split("").map((solutionCh, c) => {
              if (solutionCh === "#")
                return <div key={`${r},${c}`} className="aspect-square rounded-md bg-[#16181D]" />;
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
                  className="relative flex aspect-square items-center justify-center rounded-md border-[1.5px] border-ink/50 font-condensed text-xl font-semibold uppercase transition-colors lg:rounded-lg lg:text-4xl"
                  style={{
                    background: isActive
                      ? SELECT
                      : locked.has(k)
                        ? LOCKED_BG
                        : inWord
                          ? WASH
                          : "rgb(var(--surface))",
                    color: isActive
                      ? "#16181D"
                      : wrong.has(k)
                        ? "#FF3B30"
                        : locked.has(k)
                          ? "#1B9E4B"
                          : done && !done.revealed
                            ? "#00C853"
                            : inWord
                              ? "#16181D"
                              : "rgb(var(--ink))",
                  }}
                >
                  {num && (
                    <span
                      className="absolute left-0.5 top-0 text-[8px] font-bold opacity-60 lg:left-1 lg:text-[11px]"
                      style={{ color: isActive || inWord ? "#16181D" : "rgb(var(--ink-2))" }}
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
                ? done.score > 0
                  ? `+${done.score} for the letters you had right`
                  : "No points this time - tomorrow's grid awaits"
                : checks === 0
                  ? "Clean solve - no checks used"
                  : `Solved with ${checks} ${checks === 1 ? "check" : "checks"}`}
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-4 flex w-full max-w-[340px] items-stretch gap-1.5 lg:hidden">
            <button
              onClick={() => gotoSlot(-1)}
              aria-label="Previous clue"
              className="card-ink-flat shrink-0 rounded-xl px-3 text-ink-secondary"
            >
              ‹
            </button>
            <button
              onClick={() => setDir((d) => (d === "A" ? "D" : "A"))}
              className="ink-fix wonky min-h-[3rem] flex-1 border-2 border-ink px-3 py-2 text-center"
              style={{ background: PASTEL }}
            >
              <span
                className={`text-[13px] font-bold leading-snug text-ink ${
                  activeSlot && isSlotFilled(activeSlot, dir) ? "line-through opacity-50" : ""
                }`}
              >
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
              className="card-ink-flat shrink-0 rounded-xl px-3 text-ink-secondary"
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
              {/* On-screen keyboard - touch only; desktop types on the real keyboard */}
              <div className="flex flex-col gap-1.5 lg:hidden">
                {KEY_ROWS.map((row, i) => (
                  <div key={i} className="flex justify-center gap-1.5">
                    {row.split("").map((k) => (
                      <button
                        key={k}
                        onClick={() => type(k)}
                        className="card-ink-flat flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-extrabold text-ink active:scale-95"
                      >
                        {k}
                      </button>
                    ))}
                    {i === 2 && (
                      <button
                        onClick={() => type("BACK")}
                        aria-label="Delete"
                        className="card-ink-flat flex h-11 flex-[1.6] items-center justify-center rounded-lg text-base font-extrabold text-ink active:scale-95"
                      >
                        ⌫
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                      : "Check & lock in"}
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* RIGHT: the full clue list on desktop, active clue highlighted. Touch
            devices keep the single clue bar above, so this is desktop-only. */}
        {!done && (
          <div className="hidden lg:block lg:w-80 lg:shrink-0 lg:pt-10">
            {(["A", "D"] as Dir[]).map((d) => (
              <div key={d} className="mb-6">
                <p className="small-caps mb-2 text-xs font-bold text-ink-secondary">
                  {d === "A" ? "Across" : "Down"}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {(d === "A" ? day.across : day.down).map((slot) => {
                    const isActive = dir === d && activeSlot?.num === slot.num;
                    const filled = isSlotFilled(slot, d);
                    return (
                      <li key={`${d}${slot.num}`}>
                        <button
                          onClick={() => {
                            setActive({ r: slot.row, c: slot.col });
                            setDir(d);
                          }}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-[15px] leading-snug transition-colors hover:bg-surface ${isActive ? "ink-fix" : ""}`}
                          style={isActive ? { background: WASH } : undefined}
                        >
                          <span className="font-condensed font-bold" style={{ color: ACCENT }}>
                            {slot.num}
                          </span>
                          <span
                            className={`${isActive ? "font-semibold text-ink" : "text-ink-secondary"} ${
                              filled ? "line-through opacity-50" : ""
                            }`}
                          >
                            {slot.clue}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </GameShell>
  );
}
