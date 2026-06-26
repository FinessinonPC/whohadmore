"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface CountUpProps {
  value: number;
  /** When true, animate 0 -> value. When false, sit at 0. */
  run: boolean;
  duration?: number;
  className?: string;
}

/**
 * Counts a number up from 0 to `value` with an ease-out-expo curve - fast off
 * the line, settling into the final figure. This is the hero beat of every
 * reveal, so the easing is deliberately weighty rather than linear.
 */
export function CountUp({ value, run, duration = 1.4, className }: CountUpProps) {
  const mv = useMotionValue(0);
  // Match the target's precision: integers count as integers, decimals to 0.1.
  const decimals = Number.isInteger(value) ? 0 : 1;

  const text = useTransform(mv, (latest) => {
    const n =
      decimals === 0 ? Math.round(latest) : Number(latest.toFixed(1));
    return n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  useEffect(() => {
    if (!run) {
      mv.set(0);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // ease-out-expo
    });
    return () => controls.stop();
  }, [run, value, duration, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
