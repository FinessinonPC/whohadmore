"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/clientTrack";
import { clearLevelUp, subscribeLevelUp, type LevelUp } from "@/lib/levelUp";

// ============================================================================
// The level-up celebration. Mounted once in the layout; any game that tips the
// player over a level hands its payload to lib/levelUp and this shows up on
// top of whatever else is on screen (z-80, above the card-complete modal at
// z-70, so the big moment lands first and the scorecard is waiting behind it).
//
// The dopamine beats, in order: paper confetti bursts -> the level number
// flips up from the old one -> the ring sweeps back to empty and refills with
// the points already banked toward the NEXT level -> the total counts up. The
// dismiss is deliberately a "keep playing" nudge, not just an X.
// ============================================================================

export function LevelUpHost() {
  const [data, setData] = useState<LevelUp | null>(null);
  useEffect(() => subscribeLevelUp(setData), []);
  if (!data) return null;
  return <LevelUpModal data={data} onClose={clearLevelUp} />;
}

/** Count a number up over `ms`, easing out so it decelerates into the total. */
function useCountUp(target: number, ms: number, delay = 0): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, Math.max(0, (t - start - delay) / ms));
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, ms, delay]);
  return value;
}

// Torn-paper scraps in the site's ink/gold/red, not glossy round confetti.
const SCRAP_COLORS = ["#FFB300", "#B03A2A", "#00C853", "#4A7FD4", "#2B2620"];

function Confetti() {
  // Deterministic-ish spread computed once, so a re-render doesn't reshuffle.
  const scraps = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        color: SCRAP_COLORS[i % SCRAP_COLORS.length],
        x: (i % 2 === 0 ? 1 : -1) * (18 + ((i * 37) % 150)),
        y: -(90 + ((i * 53) % 190)),
        rotate: ((i * 71) % 360) - 180,
        delay: (i % 7) * 0.035,
        w: 5 + ((i * 13) % 7),
        h: 9 + ((i * 17) % 9),
      })),
    []
  );
  // Sits in the overlay, NOT in the card - the card clips its own overflow, so
  // scraps launched from inside it would be sliced off at the border.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {scraps.map((s, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ width: s.w, height: s.h, background: s.color }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: [1, 1, 0], x: s.x, y: [0, s.y, s.y + 260], rotate: s.rotate }}
          transition={{ duration: 1.9, delay: s.delay, ease: "easeOut", times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}

function LevelUpModal({ data, onClose }: { data: LevelUp; onClose: () => void }) {
  const progress = data.needed > 0 ? Math.min(1, data.into / data.needed) : 0;
  const total = useCountUp(data.totalScore, 900, 250);
  const toGo = Math.max(0, data.needed - data.into);

  useEffect(() => {
    // The events table stores strings, so the level rides in `surface`.
    trackEvent("level_up_shown", { surface: `level_${data.to}` });
  }, [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Level ${data.to} reached`}
    >
      <motion.div
        className="absolute inset-0 bg-[#0b0906]/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="card-ink tilt-r relative z-10 w-full max-w-[360px] px-5 pb-4 pt-5"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 320 }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-1.5 z-30 text-2xl leading-none text-ink-secondary transition-colors hover:text-ink"
        >
          ×
        </button>

        <div className="relative z-10 text-center">
          <motion.span
            className="stamp-red"
            initial={{ scale: 1.6, opacity: 0, rotate: -14 }}
            animate={{ scale: 1, opacity: 1, rotate: -2 }}
            transition={{ type: "spring", damping: 12, stiffness: 260, delay: 0.15 }}
          >
            Level up
          </motion.span>

          <div className="mt-4 flex justify-center">
            <LevelRing level={data.to} previous={data.from} progress={progress} />
          </div>

          <motion.p
            className="mt-3.5 font-display text-3xl font-semibold uppercase tracking-wide text-ink"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            <span className="marker-gold">{data.title}</span>
          </motion.p>
          <motion.p
            className="mt-1 text-[13px] font-semibold text-ink-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {data.titleChanged ? "New rank unlocked." : `You're a Level ${data.to} player.`}
          </motion.p>
        </div>

        {/* the running total, counting up */}
        <div className="card-ink-flat relative z-10 mt-4 px-3 py-2.5 text-center">
          <p className="small-caps text-[10px] font-bold text-ink-secondary">Career points</p>
          <p className="tabular font-condensed text-4xl font-semibold leading-none text-ink">
            {total.toLocaleString()}
          </p>
        </div>

        {/* progress into the next level - the "you're already partway" hook */}
        <div className="relative z-10 mt-3">
          <div className="mb-1.5 flex items-baseline justify-between text-[11px] font-semibold text-ink-secondary">
            <span>
              <span className="text-ink">{data.into.toLocaleString()}</span> / {data.needed.toLocaleString()} pts
            </span>
            <span>Level {data.to + 1}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-background">
            <motion.div
              className="h-full bg-[#FFB300]"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ delay: 1.1, type: "spring", damping: 26, stiffness: 140 }}
            />
          </div>
          <p className="mt-1.5 text-center text-[11px] text-ink-secondary">
            {toGo.toLocaleString()} more points to Level {data.to + 1}.
          </p>
        </div>

        <Link
          href="/profile"
          onClick={() => {
            trackEvent("level_up_profile_click", { surface: `level_${data.to}` });
            onClose();
          }}
          className="ink-fix wonky mt-3.5 flex items-center justify-center border-2 border-ink bg-[#F8E6A2] px-4 py-3 text-[15px] font-bold text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          See your progress →
        </Link>

        <button
          onClick={onClose}
          className="small-caps mt-2.5 w-full py-1 text-center text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
        >
          Keep playing
        </button>
      </motion.div>

      <Confetti />
    </div>
  );
}

/** The ring: fills to full at the old level, snaps the number up, then empties
 *  and refills to whatever is already banked toward the next one. */
function LevelRing({ level, previous, progress }: { level: number; previous: number; progress: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(previous);

  useEffect(() => {
    const t = setTimeout(() => setShown(level), 620);
    return () => clearTimeout(t);
  }, [level]);

  return (
    <div className="relative h-[104px] w-[104px]">
      <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90">
        <circle cx="52" cy="52" r={r} fill="none" className="stroke-border" strokeWidth="9" />
        <motion.circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke="#FFB300"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c * 0.25 }}
          animate={{ strokeDashoffset: [c * 0.25, 0, c, c * (1 - progress)] }}
          transition={{ duration: 1.5, times: [0, 0.4, 0.42, 1], ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
        <span className="small-caps text-[9px] leading-none text-ink-secondary">Level</span>
        <motion.span
          key={shown}
          className="font-condensed text-4xl font-semibold leading-none text-ink"
          initial={{ y: shown === previous ? 0 : 26, opacity: shown === previous ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 340 }}
        >
          {shown}
        </motion.span>
      </div>
    </div>
  );
}
