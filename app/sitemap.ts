import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";
import { LIVE_MODES } from "@/lib/modes";
import { getServerSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { todayISO } from "@/lib/date";
import { FREE_ARCHIVE_DAYS, isFreeArchiveDate } from "@/lib/archiveWindow";

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
 *  - the recent archive, one page per published day inside the free window.
 *    This is the only part of the surface that grows without anyone writing
 *    anything: one more page a day, for as long as the site keeps publishing.
 *
 * Deliberately absent, and noindexed in middleware.ts so the two agree:
 *  - /day/<date> older than the free window. Still gated, and a gated page is
 *    a search result that hands a stranger a signup form instead of a puzzle.
 *  - /games/<id>, the explainers. They outrank the playable pages for game
 *    names, which is exactly backwards.
 *  - the dated game routes and the bare /YYYY-MM-DD alias, which are the same
 *    game as the bare route.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const today = todayISO();

  const items: MetadataRoute.Sitemap = [
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

  // The free window, one entry per published day. Today is excluded: /day/<today>
  // redirects to the homepage, so listing it would point at a redirect.
  if (isSupabaseConfigured()) {
    try {
      const { data } = await getServerSupabase()
        .from("daily_games")
        .select("play_date")
        .eq("published", true)
        .lte("play_date", today)
        .order("play_date", { ascending: false })
        .limit(FREE_ARCHIVE_DAYS + 1)
        .returns<{ play_date: string }[]>();
      for (const g of data ?? []) {
        if (g.play_date === today) continue;
        if (!isFreeArchiveDate(g.play_date, today)) continue;
        items.push({
          url: `${base}/day/${g.play_date}`,
          lastModified: new Date(g.play_date),
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    } catch {
      /* the evergreen routes still ship - a sitemap missing days beats none */
    }
  }

  return items;
}
