import type { DailyGame } from "@/types";

type PuzzleMeta = Pick<DailyGame, "topic_label" | "stat_label"> & {
  description?: string | null;
};

/** SEO page title for a puzzle. The root layout appends " · WhoHadMore". */
export function puzzleTitle(meta: Pick<DailyGame, "topic_label">): string {
  return `${meta.topic_label} - Higher or Lower`;
}

/** Meta-description for a puzzle page: the custom blurb if set, else generated. */
export function puzzleDescription(meta: PuzzleMeta): string {
  const custom = meta.description?.trim();
  if (custom) return custom;
  const stat = meta.stat_label.toLowerCase();
  return `Who had more ${stat}? Play "${meta.topic_label}" - a free daily higher-or-lower guessing game. Two cards, one stat, three lives, and a brand-new puzzle every day.`;
}
