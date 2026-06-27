import Link from "next/link";
import { puzzleDescription } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { formatDisplayDate, todayISO } from "@/lib/date";
import type { FullGame } from "@/types";

/**
 * Crawlable, keyword-rich content rendered BELOW the game (below the fold, so it
 * never disturbs play). This is what lets each puzzle rank for its topic + the
 * "higher or lower" search intent, plus breadcrumb + Game structured
 * data. The lineup is hidden for today's puzzle to avoid spoiling it.
 */
export function GameSeoFooter({ game, date }: { game: FullGame; date: string }) {
  const topic = game.topic_label;
  const statLower = game.stat_label.toLowerCase();
  const lead = puzzleDescription(game);
  const isToday = date === todayISO();
  const entities = game.cards.map((c) => c.entity_name).filter(Boolean);

  const base = getSiteUrl();
  const url = `${base}/play/${date}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WhoHadMore", item: base },
          { "@type": "ListItem", position: 2, name: "Archive", item: `${base}/archive` },
          { "@type": "ListItem", position: 3, name: topic, item: url },
        ],
      },
      {
        "@type": "Game",
        name: `${topic} - WhoHadMore`,
        description: lead,
        url,
        genre: "Trivia",
        gamePlatform: "Web browser",
        datePublished: date,
        inLanguage: "en",
        author: { "@type": "Organization", name: "WhoHadMore" },
      },
    ],
  };

  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto w-full max-w-2xl px-5 py-12 text-[15px] leading-relaxed text-ink-secondary">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{topic}</h2>
        <p className="mt-3">{lead}</p>

        <h3 className="mt-7 text-lg font-extrabold text-ink">How to play</h3>
        <p className="mt-1">
          Two cards appear with one card&apos;s {statLower} shown. Tap whichever you think is
          higher. A correct guess continues the chain; a wrong one costs a life, and you start with
          three. It&apos;s free, plays in your browser on phone or desktop, and a brand-new
          higher-or-lower puzzle drops every day.
        </p>

        {!isToday && entities.length > 0 && (
          <>
            <h3 className="mt-7 text-lg font-extrabold text-ink">Featured in this puzzle</h3>
            <p className="mt-1">
              {topic} ({formatDisplayDate(date)}) compares {statLower} across {entities.join(", ")}.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/" className="rounded-full bg-cta px-4 py-2 text-xs font-bold text-white">
            Play today&apos;s game
          </Link>
          <Link href="/archive" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            Browse all puzzles
          </Link>
          <Link href="/about" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            How it works
          </Link>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
