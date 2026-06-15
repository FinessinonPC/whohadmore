// ============================================================================
// Game feedback — silent haptics only (no audio). Best-effort; no-ops where the
// Vibration API is unavailable (e.g. desktop, iOS Safari).
// ============================================================================

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

export function feedbackCorrect(): void {
  vibrate(14);
}

export function feedbackWrong(): void {
  vibrate([0, 35, 45, 35]);
}
