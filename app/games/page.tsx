import Link from "next/link";
import type { Metadata } from "next";
import { TopNav } from "@/components/ui/TopNav";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { GAME_SEO } from "@/lib/gameSeo";
import { modeDef } from "@/lib/modes";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

const DESCRIPTION =
  "All four free daily games on WhoHadMore: Chain (higher or lower), Duality (double meanings), Word (five letters, six tries) and the Mini crossword. New puzzles every midnight.";

export const metadata: Metadata = {
  title: "The Games - Four Free Daily Puzzles",
  description: DESCRIPTION,
  alternates: { canonical: "/games" },
  openGraph: { title: "The Games · WhoHadMore", description: DESCRIPTION, url: "/games" },
};

export default function GamesIndexPage() {
  const base = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "WhoHadMore daily games",
    numberOfItems: GAME_SEO.length,
    itemListElement: GAME_SEO.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: modeDef(g.id).name,
      description: g.standfirst,
      url: `${base}/games/${g.id}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-5">
      <TopNav />

      <header className="mt-8">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
          Four free daily games
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-secondary">
          WhoHadMore is a set of four quick puzzles that refresh every midnight. Each one takes about
          a minute, each is worth up to 1,000 points, and together they make one daily score on a
          shared leaderboard. Everything is free and plays in your browser.
        </p>
      </header>

      <div className="mt-10 flex flex-col">
        {GAME_SEO.map((g) => {
          const def = modeDef(g.id);
          return (
            <article key={g.id} className="border-b border-border py-7 last:border-b-0">
              <Link href={`/games/${g.id}`} className="group block">
                <span style={{ color: def.accent }}>
                  <GameWordmark mode={g.id} className="text-3xl" />
                </span>
                <h2 className="mt-2 font-display text-xl font-semibold text-ink">{g.seoTitle}</h2>
              </Link>
              <p className="mt-2 text-[16px] leading-relaxed text-ink-secondary">{g.about[0]}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
                <Link href={`/games/${g.id}`} className="text-ink underline decoration-2 underline-offset-4">
                  How to play {def.name}
                </Link>
                <Link href={def.href("today").replace("/today", "")} className="text-ink-secondary hover:text-ink">
                  Play now &rarr;
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-10 border-t-2 border-ink pt-8">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
          <Link href="/" className="text-ink underline decoration-2 underline-offset-4">
            Play today&apos;s card
          </Link>
          <Link href="/archive" className="text-ink underline decoration-2 underline-offset-4">
            Past puzzles
          </Link>
          <Link href="/faq" className="text-ink underline decoration-2 underline-offset-4">
            FAQ
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
