// ============================================================================
// Daily seed RNG
//
// Deterministic randomness keyed off a date string, so every player who opens
// a given day's game experiences the exact same card order. Cards are stored
// with an explicit `position`, but this lets us reproduce a stable shuffle
// when we want one (e.g. tie-break ordering) without persisting it.
// ============================================================================

/** Hash an arbitrary string into a 32-bit unsigned integer seed. */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  // Finalize to a well-mixed unsigned 32-bit value.
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 - a tiny, fast, well-distributed seeded PRNG returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a seeded PRNG from a date string like "2026-06-15". */
export function dailyRng(dateStr: string): () => number {
  return mulberry32(hashSeed(`whohadmore:${dateStr}`));
}

/** Deterministic Fisher–Yates shuffle driven by the provided PRNG. */
export function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
