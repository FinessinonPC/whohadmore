import type { DailyGame } from "@/types";

type PuzzleMeta = Pick<DailyGame, "topic_label" | "stat_label"> & {
  description?: string | null;
};

/** SEO page title for a puzzle. The root layout appends " · WhoHadMore". */
export function puzzleTitle(meta: Pick<DailyGame, "topic_label">): string {
  return `${meta.topic_label} - Higher or Lower`;
}

/** Meta-description for a puzzle page: the custom blurb if set, else generated.
 *  Pass the puzzle's entities to name them in the snippet - this is what lets the
 *  page rank for long-tail "{name} vs {name} {stat}" searches. */
export function puzzleDescription(meta: PuzzleMeta, entities?: string[]): string {
  const custom = meta.description?.trim();
  const base =
    custom ||
    `Play "${meta.topic_label}" - a free daily higher-or-lower game. Two cards, one stat: tap whichever is higher. A brand-new puzzle drops every day.`;
  const named = (entities ?? []).filter(Boolean).slice(0, 4);
  if (named.length === 0) return base;
  return `${base} Featuring ${named.join(", ")} and more.`;
}
