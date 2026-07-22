import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 3600;

// Only the durable, ungated pages belong in search. The per-day game pages
// (/play/<date> and friends) are intentionally left out and marked noindex in
// middleware.ts - they're a long tail of mostly sign-in-gated URLs we don't want
// competing with the main site. Google should show www.whohadmore.com's core
// pages, not a scatter of individual games.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/category`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
