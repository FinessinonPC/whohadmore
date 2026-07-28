import Link from "next/link";
import { LIVE_MODES } from "@/lib/modes";
import { GAME_SEO } from "@/lib/gameSeo";
import { getSiteUrl } from "@/lib/site";

/**
 * The homepage's crawlable content, below the games.
 *
 * The games ARE the page for a human, so none of this competes with them - it
 * sits underneath. But a JS game gives Google almost nothing to read, and this
 * footer previously carried ~40 words, which is not enough to rank for
 * anything. This is the prose that explains what the site is, plus the internal
 * links into the evergreen game pages where the real topical content lives.
 */

const HOME_FAQS = [
  {
    q: "What is WhoHadMore?",
    a: "WhoHadMore is a free set of four quick daily games - Chain, Duality, Word and the Mini crossword - that refresh every midnight and add up to one combined daily score.",
  },
  {
    q: "Is it free to play?",
    a: "Yes. Every game is free in your browser on phone or desktop, with no download. An account is optional and free, and saves your streak and stats.",
  },
  {
    q: "Do I have to play all four games?",
    a: "No. Every game is worth up to 1,000 points and whatever you finish counts toward your daily total, so playing one game still puts you on the leaderboard.",
  },
  {
    q: "When do new puzzles come out?",
    a: "All four games refresh at midnight with a new Chain topic, new Duality pairs, a new five-letter word and a fresh Mini crossword.",
  },
];

export function SiteSeoFooter() {
  const base = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "WhoHadMore daily games",
        numberOfItems: LIVE_MODES.length,
        itemListElement: GAME_SEO.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${g.heading} - WhoHadMore`,
          description: g.standfirst,
          url: `${base}/games/${g.id}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: HOME_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-5 pb-12 pt-4">
      <div className="border-t border-border pt-8">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Four free daily games, one score
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          WhoHadMore is a free daily puzzle site. Every midnight four fresh games drop:{" "}
          <strong className="font-semibold text-ink">Chain</strong>, a higher-or-lower run across a
          new topic each day; <strong className="font-semibold text-ink">Duality</strong>, where
          eight definitions hide four pairs of double meanings;{" "}
          <strong className="font-semibold text-ink">Word</strong>, six tries at a five-letter
          answer; and the <strong className="font-semibold text-ink">Mini</strong>, a 5x5 crossword
          built for a coffee break. Each takes about a minute.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          Every game is worth up to 1,000 points, and whatever you finish adds up to a single daily
          total that ranks on the day&apos;s leaderboard. You don&apos;t have to play all four - one
          game still counts. Everything runs in your browser with no download, and an account is
          free and optional: it saves your streak, level and stats across devices.
        </p>

        {/* Internal links into the evergreen pages - where the topical content lives */}
        <h3 className="mt-7 font-display text-lg font-semibold text-ink">The games</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {GAME_SEO.map((g) => (
            <li key={g.id} className="text-[15px] leading-relaxed text-ink-secondary">
              <Link
                href={`/games/${g.id}`}
                className="font-semibold text-ink underline decoration-2 underline-offset-2"
              >
                {g.heading}
              </Link>{" "}
              &mdash; {g.standfirst}
            </li>
          ))}
        </ul>

        {/* FAQ - matches the FAQPage schema above */}
        <h3 className="mt-7 font-display text-lg font-semibold text-ink">Common questions</h3>
        <dl className="mt-2">
          {HOME_FAQS.map((f) => (
            <div key={f.q} className="border-b border-border py-3 last:border-b-0">
              <dt className="text-[15px] font-bold text-ink">{f.q}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-ink-secondary">{f.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
          <Link href="/games" className="text-ink underline decoration-2 underline-offset-4">
            All four games
          </Link>
          <Link href="/archive" className="text-ink underline decoration-2 underline-offset-4">
            Past puzzles
          </Link>
          <Link href="/leaderboard" className="text-ink underline decoration-2 underline-offset-4">
            Leaderboard
          </Link>
          <Link href="/faq" className="text-ink underline decoration-2 underline-offset-4">
            FAQ
          </Link>
          <Link href="/about" className="text-ink underline decoration-2 underline-offset-4">
            About
          </Link>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
