import Link from "next/link";
import { puzzleDescription } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { getRecentGameLinks } from "@/lib/games";
import { formatDisplayDate, todayISO } from "@/lib/date";
import type { FullGame } from "@/types";

/** Format a stat value with thousands separators and its unit. */
function formatStat(value: number, unit: string | null): string {
  const num = Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return unit ? `${num} ${unit}` : num;
}

/**
 * Crawlable, keyword-rich content rendered BELOW the game (below the fold, so it
 * never disturbs play). Each puzzle ranks for its topic, the people/things in it,
 * and the "higher or lower" / "who had more" search intent.
 *
 * Archived puzzles publish the full ranked answer - so the page literally answers
 * "who had more {stat}, {A} or {B}?" for its entities (strong long-tail SEO).
 * Today's puzzle only names the lineup so the result stays a surprise. Emits
 * Breadcrumb + Game + (for archived games) ItemList structured data, and internal
 * links to other puzzles so Google crawls the whole archive.
 */
export async function GameSeoFooter({ game, date }: { game: FullGame; date: string }) {
  const topic = game.topic_label;
  const stat = game.stat_label;
  const statLower = stat.toLowerCase();
  const lead = puzzleDescription(game);
  const isToday = date === todayISO();
  const entities = game.cards.map((c) => c.entity_name).filter(Boolean);
  const ranked = [...game.cards]
    .filter((c) => c.entity_name)
    .sort((a, b) => b.stat_value - a.stat_value);
  const recent = await getRecentGameLinks(date, 6);

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
        about: entities.map((name) => ({ "@type": "Thing", name })),
      },
      ...(!isToday && ranked.length > 0
        ? [
            {
              "@type": "ItemList",
              name: `${topic} ranked by ${stat}`,
              itemListOrder: "https://schema.org/ItemListOrderDescending",
              numberOfItems: ranked.length,
              itemListElement: ranked.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.entity_name,
              })),
            },
          ]
        : []),
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

        {isToday && entities.length > 0 && (
          <>
            <h3 className="mt-7 text-lg font-extrabold text-ink">In today&apos;s puzzle</h3>
            <p className="mt-1">
              Today&apos;s higher-or-lower puzzle features {entities.join(", ")}. Play now and guess
              which is higher on {statLower} - the full ranking reveals as you go.
            </p>
          </>
        )}

        {!isToday && ranked.length > 0 && (
          <>
            <h3 className="mt-7 text-lg font-extrabold text-ink">
              Who had more? {topic}, ranked by {statLower}
            </h3>
            <p className="mt-1">
              Curious how it shook out, or settling a debate? The full {statLower} ranking for all{" "}
              {ranked.length} ({formatDisplayDate(date)}) is tucked away below - it&apos;s the
              complete answer key, so open it only if you don&apos;t mind the spoiler.
            </p>
            {/* In the HTML (crawlable) but collapsed by default, so players can't
                skim the answers by scrolling - they have to choose to reveal them. */}
            <details className="mt-3 rounded-xl border border-border bg-background/60 px-4 py-3">
              <summary className="cursor-pointer select-none text-sm font-bold text-ink">
                Reveal the full ranking (spoiler)
              </summary>
              <ol className="mt-3 space-y-1.5">
                {ranked.map((c, i) => (
                  <li key={c.id} className="flex items-baseline gap-2">
                    <span className="w-5 shrink-0 tabular-nums text-ink-secondary">{i + 1}.</span>
                    <span className="font-semibold text-ink">{c.entity_name}</span>
                    <span className="text-ink-secondary">
                      - {formatStat(c.stat_value, game.stat_unit)}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
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
                    className="inline-block rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink"
                  >
                    {g.topic_label}
                  </Link>
                </li>
              ))}
            </ul>
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
