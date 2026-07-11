import Link from "next/link";
import { puzzleDescription } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { getRecentGameLinks } from "@/lib/games";
import { getCategorySeo } from "@/lib/categories";
import { todayISO } from "@/lib/date";
import type { FullGame } from "@/types";

/**
 * Crawlable, keyword-rich content rendered BELOW the game (below the fold, so it
 * never disturbs play). Each puzzle ranks for its topic, the people/things in it,
 * and the "higher or lower" search intent.
 *
 * By design this is a GAME, not a stats reference - the answers (who ranks where)
 * are NEVER put on the page. We list only the lineup names, alphabetized so the
 * order gives nothing away, plus Breadcrumb + Game structured data and internal
 * links so Google crawls the whole archive.
 */
export async function GameSeoFooter({ game, date }: { game: FullGame; date: string }) {
  const topic = game.topic_label;
  const statLower = game.stat_label.toLowerCase();
  const lead = puzzleDescription(game);
  const isToday = date === todayISO();
  // Names only, alphabetized so the order never hints at the ranking.
  const names = game.cards
    .map((c) => c.entity_name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const recent = await getRecentGameLinks(date, 6);
  const cat = getCategorySeo(game.topic_category ?? "");

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
        about: names.map((name) => ({ "@type": "Thing", name })),
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

        {names.length > 0 && (
          <>
            <h3 className="mt-7 text-lg font-extrabold text-ink">
              {isToday ? "In today's puzzle" : "Featured in this puzzle"}
            </h3>
            <p className="mt-1">
              {isToday
                ? `Today's higher-or-lower puzzle features ${names.join(", ")}. Play now and guess which is higher on ${statLower} - no spoilers here, the answers reveal only as you play.`
                : `This puzzle compares ${statLower} across ${names.join(", ")}. Play it free and guess which is higher - the answers reveal only as you play.`}
            </p>
          </>
        )}

        {recent.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-extrabold text-ink">More daily puzzles</h3>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {recent.map((g) => (
                <li key={g.play_date}>
                  <Link
                    href={`/play/${g.play_date}`}
                    className="wonky inline-block border border-ink/30 bg-card px-4 py-2 text-xs font-bold text-ink"
                  >
                    {g.topic_label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/" className="wonky bg-cta px-4 py-2 text-xs font-bold text-background">
            Play today&apos;s game
          </Link>
          {cat && (
            <Link
              href={`/category/${cat.slug}`}
              className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink"
            >
              More {cat.label} puzzles
            </Link>
          )}
          <Link href="/archive" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            Browse all puzzles
          </Link>
          <Link href="/category" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            All categories
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
