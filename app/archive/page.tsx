import type { Metadata } from "next";
import { ArchiveCalendar } from "@/components/archive/ArchiveCalendar";
import { ArchiveList } from "@/components/archive/ArchiveList";
import { TopNav } from "@/components/ui/TopNav";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { getSiteUrl } from "@/lib/site";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Browse and replay every past WhoHadMore puzzle by date - a new daily comparison game across sports, pop culture, food, geography and science.",
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
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">WhoHadMore Archive</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Every past WhoHadMore puzzle, free to replay - {games.length} daily higher-or-lower
          games and counting. Pick any day below and guess which is higher.
        </p>
      </div>

      {/* Calendar on desktop, list on mobile */}
      <div className="hidden sm:block">
        <ArchiveCalendar games={games} />
      </div>
      <div className="sm:hidden">
        <ArchiveList games={games} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </main>
  );
}
