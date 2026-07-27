import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { getServerSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { todayISO } from "@/lib/date";
import { CATEGORIES } from "@/lib/categories";
import { GAME_SEO } from "@/lib/gameSeo";

export const revalidate = 3600; // refresh hourly so new days appear

/**
 * Every URL we actually want in search:
 *  - the evergreen pages (home, /games, /games/<id>, /faq, /about, archive,
 *    leaderboard, categories) - these are what can rank for real queries
 *  - one page per published day (/day/<date>) - the compounding long tail
 *
 * Deliberately absent: /play, /word, /mini, /duality/<date> and the bare
 * /YYYY-MM-DD alias. They render the same day with less content and are
 * noindexed in middleware.ts, so listing them would be a contradictory signal.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const items: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/games`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...GAME_SEO.map((g) => ({
      url: `${base}/games/${g.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
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
  ];

  // One entry per published day - the archive is where long-tail volume comes
  // from, and it grows by itself every single day.
  if (isSupabaseConfigured()) {
    try {
      const { data } = await getServerSupabase()
        .from("daily_games")
        .select("play_date")
        .eq("published", true)
        .lte("play_date", todayISO())
        .order("play_date", { ascending: false })
        .limit(2000)
        .returns<{ play_date: string }[]>();
      for (const g of data ?? []) {
        // Today's card canonicalizes to the homepage (/day/<today> redirects).
        if (g.play_date === todayISO()) continue;
        items.push({
          url: `${base}/day/${g.play_date}`,
          lastModified: new Date(g.play_date),
          changeFrequency: "yearly",
          priority: 0.5,
        });
      }
    } catch {
      /* sitemap still returns the evergreen routes */
    }
  }

  return items;
}
