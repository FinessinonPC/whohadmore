import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/ui/TopNav";
import { CATEGORIES } from "@/lib/categories";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { getSiteUrl } from "@/lib/site";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Browse WhoHadMore's daily puzzles by category - sports, entertainment, geography, science, and current events. A fresh set of guessing puzzles every day.";

export const metadata: Metadata = {
  title: "Categories",
  description: DESCRIPTION,
  alternates: { canonical: "/category" },
  openGraph: { title: "Daily Puzzles by Category", description: DESCRIPTION, url: "/category" },
};

export default async function CategoryIndexPage() {
  const games = await getPublishedGamesWithNumbers(todayISO());
  const counts = games.reduce<Record<string, number>>((acc, g) => {
    if (g.topic_category) acc[g.topic_category] = (acc[g.topic_category] ?? 0) + 1;
    return acc;
  }, {});

  const base = getSiteUrl();
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "WhoHadMore daily puzzle categories",
    numberOfItems: CATEGORIES.length,
    itemListElement: CATEGORIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.label} Daily Puzzles`,
      url: `${base}/category/${c.slug}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:max-w-4xl">
      <TopNav />

      <div className="mb-6 mt-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Daily Puzzles, by category</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-secondary">
          {DESCRIPTION} Pick a category to play every puzzle in it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => {
          const n = counts[c.slug] ?? 0;
          return (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group rounded-2xl border border-border bg-surface/50 p-5 transition-colors hover:border-ink/20 hover:bg-surface"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-extrabold text-ink">{c.label} Daily Puzzles</h2>
                <span className="shrink-0 text-xs font-bold text-ink-secondary">
                  {n} {n === 1 ? "puzzle" : "puzzles"}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">{c.tagline}</p>
              <span className="mt-3 inline-block text-xs font-bold text-ink-secondary transition-colors group-hover:text-ink">
                Play {c.label} &rarr;
              </span>
            </Link>
          );
        })}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </main>
  );
}
