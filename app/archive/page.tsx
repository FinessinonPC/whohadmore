import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveBrowser } from "@/components/archive/ArchiveBrowser";
import { TopNav } from "@/components/ui/TopNav";
import { CATEGORIES } from "@/lib/categories";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { getSiteUrl } from "@/lib/site";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Browse every past day of WhoHadMore - four daily games per day, each with its own leaderboard. Sign in free to replay any day.",
  alternates: { canonical: "/archive" },
};

export default async function ArchivePage() {
  const games = await getPublishedGamesWithNumbers(todayISO());
  const base = getSiteUrl();
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "WhoHadMore puzzle archive",
    numberOfItems: games.length,
    itemListElement: games.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${base}/play/${g.play_date}`,
      name: `${g.topic_label} - Higher or Lower`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:max-w-4xl">
      <TopNav />

      <div className="mb-6 mt-8">
        <h1 className="font-condensed text-4xl font-semibold uppercase tracking-wide text-ink">Archive</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {games.length} {games.length === 1 ? "day" : "days"} and counting - four games each,
          with that day&apos;s leaderboard. Pick a day to open its games (sign in free to play
          past days).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-ink-secondary">Browse by category:</span>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-bold text-ink transition-colors hover:border-ink/20"
          >
            {c.label}
          </Link>
        ))}
      </div>

      <ArchiveBrowser games={games} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </main>
  );
}
