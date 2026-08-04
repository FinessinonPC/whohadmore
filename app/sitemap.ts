import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";
import { LIVE_MODES } from "@/lib/modes";

export const revalidate = 3600;

/**
 * Every URL we want in search - and the rule behind the list is that each one
 * should be somewhere a stranger is glad to land.
 *
 *  - the homepage, for the brand itself: search "whohadmore" and you get
 *    today's four cards, not one game out of context
 *  - /chain, /duality, /word, /mini: search a game by name and you get that
 *    game, today's copy, playable on arrival
 *  - the supporting pages people actually browse to
 *
 * Deliberately absent, and noindexed in middleware.ts so the two agree:
 *  - /day/<date>, the archive. It sits behind the sign-in wall for anyone
 *    without an account, so as a search result it hands a stranger a signup
 *    form. This was the part of the index that compounded on its own; it
 *    earns its place back the day the archive stops being gated.
 *  - /games/<id>, the explainers. They outrank the playable pages for game
 *    names, which is exactly backwards.
 *  - the dated game routes and the bare /YYYY-MM-DD alias, which are the same
 *    game as the bare route.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },

    // One playable page per game - the pages that have to win "<game>
    // whohadmore". Daily, because the puzzle behind each one changes nightly.
    ...LIVE_MODES.map((m) => ({
      url: `${base}/${m.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),

    { url: `${base}/games`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/category`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    { url: `${base}/leaderboard`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
