import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { GAME_SEO, gameSeo } from "@/lib/gameSeo";
import { LIVE_MODES, modeDef } from "@/lib/modes";
import { getSiteUrl } from "@/lib/site";
import { todayISO } from "@/lib/date";

// Evergreen: the copy doesn't change day to day, so this can be fully static.
export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return GAME_SEO.map((g) => ({ game: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string }>;
}): Promise<Metadata> {
  const { game } = await params;
  const seo = gameSeo(game);
  if (!seo) return {};
  return {
    title: seo.seoTitle,
    description: seo.metaDescription,
    alternates: { canonical: `/games/${seo.id}` },
    openGraph: {
      title: `${seo.seoTitle} · WhoHadMore`,
      description: seo.metaDescription,
      url: `/games/${seo.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.seoTitle,
      description: seo.metaDescription,
    },
  };
}

export default async function GameLandingPage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  const seo = gameSeo(game);
  if (!seo) notFound();

  const def = modeDef(seo.id);
  const base = getSiteUrl();
  const playHref = def.href(todayISO());
  const others = LIVE_MODES.filter((m) => m.id !== seo.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        "@id": `${base}/games/${seo.id}#game`,
        name: `${def.name} - WhoHadMore`,
        alternateName: def.name,
        url: `${base}/games/${seo.id}`,
        description: seo.metaDescription,
        genre: ["Puzzle", "Word game", "Daily game"],
        gamePlatform: "Web browser",
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        playMode: "SinglePlayer",
        isAccessibleForFree: true,
        publisher: { "@id": `${base}/#org` },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: seo.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: "Games", item: `${base}/games` },
          { "@type": "ListItem", position: 3, name: def.name, item: `${base}/games/${seo.id}` },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-5">

      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mt-6 text-[11px] font-semibold text-ink-secondary">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/games" className="hover:text-ink">Games</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{def.name}</span>
      </nav>

      {/* hero */}
      <header className="mt-5">
        <span style={{ color: def.accent }}>
          <GameWordmark mode={seo.id} className="text-5xl" />
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {seo.seoTitle}
        </h1>
        <p className="mt-2 font-condensed text-lg text-ink-secondary">{seo.standfirst}</p>
        <Link
          href={playHref}
          className="mt-5 inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-base font-bold text-background transition-transform active:translate-y-0.5"
        >
          Play today&apos;s {def.name}
          <span aria-hidden>&rarr;</span>
        </Link>
      </header>

      {/* about */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">What is {def.name}?</h2>
        {seo.about.map((p, i) => (
          <p key={i} className="mt-3 text-[17px] leading-relaxed text-ink-secondary">
            {p}
          </p>
        ))}
      </section>

      {/* how to play */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">How to play</h2>
        <ol className="mt-3 flex flex-col gap-2.5">
          {seo.howToPlay.map((step, i) => (
            <li key={i} className="flex gap-3 text-[17px] leading-relaxed text-ink-secondary">
              <span className="mt-0.5 w-6 shrink-0 font-display text-lg font-bold text-ink/30">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* scoring */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">How scoring works</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-secondary">{seo.scoring}</p>
      </section>

      {/* strategy */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Tips and strategy</h2>
        <div className="mt-3 flex flex-col">
          {seo.strategy.map((s) => (
            <div key={s.title} className="border-b border-border py-4 last:border-b-0">
              <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[16px] leading-relaxed text-ink-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">
          {def.name}: frequently asked
        </h2>
        <dl className="mt-3">
          {seo.faqs.map((f) => (
            <div key={f.q} className="border-b border-border py-4 last:border-b-0">
              <dt className="font-bold text-ink">{f.q}</dt>
              <dd className="mt-1.5 text-[16px] leading-relaxed text-ink-secondary">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* internal links - the other games + archive */}
      <section className="mt-12 border-t-2 border-ink pt-8">
        <h2 className="font-display text-2xl font-semibold text-ink">The rest of the card</h2>
        <p className="mt-2 text-[16px] leading-relaxed text-ink-secondary">
          {def.name} is one of four daily games on WhoHadMore. Every game you finish adds to a single
          daily score and the day&apos;s leaderboard.
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {others.map((m) => (
            <li key={m.id}>
              <Link
                href={`/games/${m.id}`}
                className="flex items-center gap-3 border-b border-border py-3 transition-colors hover:text-ink"
              >
                <span className="w-24 shrink-0" style={{ color: m.accent }}>
                  <GameWordmark mode={m.id} className="text-xl" />
                </span>
                <span className="text-[15px] text-ink-secondary">{m.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
          <Link href="/archive" className="text-ink underline decoration-2 underline-offset-4">
            Browse past puzzles
          </Link>
          <Link href="/leaderboard" className="text-ink underline decoration-2 underline-offset-4">
            Today&apos;s leaderboard
          </Link>
          <Link href="/faq" className="text-ink underline decoration-2 underline-offset-4">
            FAQ
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
    </>
  );
}
