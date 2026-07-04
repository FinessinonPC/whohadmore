import type { TopicCategory } from "@/types";

/** SEO config for each category hub. Copy is written to rank for
 *  "{category} higher or lower" while staying honest and game-focused. */
export interface CategorySeo {
  slug: TopicCategory;
  label: string;
  tagline: string;
  intro: string;
}

export const CATEGORIES: CategorySeo[] = [
  {
    slug: "sports",
    label: "Sports",
    tagline: "Athletes, teams, and records - guess which ranks higher.",
    intro:
      "Sports higher or lower puzzles put athletes, teams, and records head to head on a single stat - points, goals, salaries, championships, speed. Two cards, one number: tap whichever is higher and see how far down the chain you can go.",
  },
  {
    slug: "entertainment",
    label: "Entertainment",
    tagline: "Movies, music, and celebrity face-offs by the numbers.",
    intro:
      "Entertainment higher or lower puzzles compare movies, music, TV, and celebrities on the numbers behind the fame - box office, streams, followers, awards. Guess which is higher and keep the chain alive.",
  },
  {
    slug: "geography",
    label: "Geography",
    tagline: "Countries, cities, and landmarks by the numbers.",
    intro:
      "Geography higher or lower puzzles line up countries, cities, and landmarks by population, area, elevation, and more. One stat at a time - just pick whichever is higher.",
  },
  {
    slug: "science",
    label: "Science",
    tagline: "Nature, space, and the numbers that run the world.",
    intro:
      "Science higher or lower puzzles compare animals, planets, elements, and phenomena on real measurements - speed, size, distance, temperature. Trust your instinct and tap the higher one.",
  },
  {
    slug: "current_events",
    label: "Current Events",
    tagline: "Fresh, timely match-ups pulled from the headlines.",
    intro:
      "Current-events higher or lower puzzles turn what is happening right now into a quick daily guessing game. Timely match-ups, refreshed constantly - guess which is higher before you scroll.",
  },
];

export const CATEGORY_SLUGS: TopicCategory[] = CATEGORIES.map((c) => c.slug);

/** Look up a category hub by its URL slug (returns undefined for unknown slugs). */
export function getCategorySeo(slug: string): CategorySeo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
