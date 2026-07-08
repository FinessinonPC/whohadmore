// ============================================================================
// Mini crossword grid skeletons - the black-square LAYOUT only (no letters).
// Each one is machine-verified: every open cell belongs to a real slot (>= 3
// letters, no orphans), and 180-degree symmetric. Fixing the layout up front
// is what makes AI (or manual) fill tractable - the hard combinatorial part of
// crossword construction (where do the black squares go?) is solved once,
// here, instead of asked of the AI on every generation.
// ============================================================================

export interface MiniSkeleton {
  id: string;
  label: string;
  hint: string;
  /** '#' = black square, anything else = open (letters fill in later). */
  rows: string[];
}

export const MINI_SKELETONS: MiniSkeleton[] = [
  {
    id: "staircase",
    label: "Staircase",
    hint: "Every cell double-checked - the tightest, hardest fill",
    rows: ["...##", "....#", ".....", "#....", "##..."],
  },
  {
    id: "open",
    label: "Open",
    hint: "Fewer black squares, 4-letter minimum - the easiest fill",
    rows: ["....#", ".....", ".....", ".....", "#...."],
  },
  {
    id: "diagonal",
    label: "Diagonal",
    hint: "Two isolated blocks - a different shape and feel",
    rows: [".....", ".#...", ".....", "...#.", "....."],
  },
];

export function miniSkeletonById(id: string): MiniSkeleton {
  return MINI_SKELETONS.find((s) => s.id === id) ?? MINI_SKELETONS[0];
}

/** True when a grid's black-square positions (ignoring letters) match this skeleton. */
export function miniMatchesSkeleton(rows: string[], skeleton: MiniSkeleton): boolean {
  return rows.every((row, r) =>
    row.split("").every((ch, c) => (ch === "#") === (skeleton.rows[r][c] === "#"))
  );
}

/** The skeleton (if any) whose black-square layout matches these rows. */
export function findMatchingSkeleton(rows: string[]): MiniSkeleton | undefined {
  return MINI_SKELETONS.find((s) => miniMatchesSkeleton(rows, s));
}
