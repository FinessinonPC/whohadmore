import Link from "next/link";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES } from "@/lib/modes";
import { CATEGORIES } from "@/lib/categories";
import { getSiteUrl } from "@/lib/site";

const GAME_LINES: Record<string, string> = {
  chain:
    "The classic higher-or-lower game: two cards, one stat, tap whichever is higher and keep the run alive on three lives.",
  duality:
    "Eight definitions hide four pairs - each pair is one word with two different meanings. Match them all.",
  word: "The daily five-letter word game: six tries, green and yellow tiles, one word for everyone.",
  mini: "A bite-size 5x5 crossword with fresh clues - fill the grid and beat the check.",
};

/**
 * Crawlable homepage footer for the WHOLE collection (the per-puzzle footer
 * lives on the game and day pages). Ranks for "daily games", the individual
 * game formats, and the brand - and gives first-time visitors the pitch.
 */
export function SiteSeoFooter() {
  const base = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "WhoHadMore daily games",
    numberOfItems: LIVE_MODES.length,
    itemListElement: LIVE_MODES.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${m.name} - WhoHadMore`,
      url: `${base}${m.href("today").replace("/today", "")}`,
    })),
  };

  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto w-full max-w-2xl px-5 py-12 text-[15px] leading-relaxed text-ink-secondary">
        <h2 className="font-condensed text-3xl font-semibold uppercase tracking-wide text-ink">
          Four quick games. One score. Every day.
        </h2>
        <p className="mt-3">
          WhoHadMore is a free collection of daily games: each one takes about a minute,
          every game feeds one combined daily score, and the leaderboard ranks the day.
          New games drop at midnight - a fresh higher-or-lower topic, new word pairs, a
          new five-letter word, and a new crossword grid.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {LIVE_MODES.map((m) => (
            <div key={m.id} className="rounded-2xl border border-border bg-background/60 p-4">
              <span style={{ color: m.accent }}>
                <GameWordmark mode={m.id} className="text-xl" />
              </span>
              <p className="mt-1.5 text-sm">{GAME_LINES[m.id]}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-lg font-extrabold text-ink">Play your way</h3>
        <p className="mt-1">
          No download, no paywall - it all runs in your browser on phone or desktop. Pick
          a username (free) to keep a streak, earn achievements, and unlock the{" "}
          <Link href="/archive" className="font-semibold text-ink underline underline-offset-2">
            archive
          </Link>{" "}
          of past days, each with its own leaderboard.
        </p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link href="/leaderboard" className="rounded-full bg-cta px-4 py-2 text-xs font-bold text-background">
            Today&apos;s leaderboard
          </Link>
          <Link href="/archive" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            Past days
          </Link>
          {CATEGORIES.slice(0, 3).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink"
            >
              {c.label}
            </Link>
          ))}
          <Link href="/about" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            About
          </Link>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
