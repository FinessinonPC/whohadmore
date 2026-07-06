// ============================================================================
// Client-side results for the extra daily modes (rank, pinpoint). Same idea as
// playStore's chain result: one finished result per mode per date, on-device.
// ============================================================================

import type { ModeId } from "@/lib/modes";

export interface ModeResult {
  score: number;
  maxScore: number;
  detail: number[]; // per-slot / per-round points for the result breakdown
  completedAt: string;
}

const key = (mode: ModeId, date: string) => `whohadmore:${mode}:${date}`;

export function getModeResult(mode: ModeId, date: string): ModeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(mode, date));
    return raw ? (JSON.parse(raw) as ModeResult) : null;
  } catch {
    return null;
  }
}

export function saveModeResult(mode: ModeId, date: string, result: ModeResult): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(mode, date), JSON.stringify(result));
  } catch {
    /* storage full / disabled - non-fatal */
  }
}
