// ============================================================================
// Game feedback — synthesized sound (Web Audio, no asset files) + haptics.
// Everything is best-effort and silent on failure. Respects a mute preference.
// ============================================================================

const MUTE_KEY = "whohadmore_muted";

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One short enveloped tone. */
function blip(
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.16
): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

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
  if (isMuted()) return;
  blip(660, 0, 0.12, "sine", 0.18);
  blip(988, 0.085, 0.16, "sine", 0.18);
}

export function feedbackWrong(): void {
  vibrate([0, 35, 45, 35]);
  if (isMuted()) return;
  blip(190, 0, 0.22, "square", 0.12);
  blip(120, 0.07, 0.26, "square", 0.1);
}

export function feedbackFinish(positive: boolean): void {
  if (isMuted()) return;
  if (positive) {
    [523, 659, 784, 1047].forEach((f, i) => blip(f, i * 0.1, 0.2, "sine", 0.16));
  } else {
    blip(330, 0, 0.2, "sine", 0.14);
    blip(247, 0.12, 0.3, "sine", 0.12);
  }
}
