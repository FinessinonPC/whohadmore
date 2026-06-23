import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { getServerSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/mockGame";
import { todayISO } from "@/lib/date";

export const revalidate = 3600; // refresh hourly so new games appear

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const items: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];

  // Every published game is its own crawlable page (good long-tail SEO).
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
      (data ?? []).forEach((g) =>
        items.push({
          url: `${base}/play/${g.play_date}`,
          changeFrequency: "yearly",
          priority: 0.4,
        })
      );
    } catch {
      /* sitemap still returns the static routes */
    }
  }

  return items;
}
