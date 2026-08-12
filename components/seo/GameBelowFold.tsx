import Link from "next/link";
import { gameSeo } from "@/lib/gameSeo";
import { LIVE_MODES, modeDef, type ModeId } from "@/lib/modes";

/**
 * The written half of a game page, below the game itself.
 *
 * These four routes are what rank for game names, and until now they carried a
 * title, a description and no body at all - so Google was ranking /mini for
 * "mini crossword" off two lines of metadata against sites with actual pages.
 * The writing existed the whole time, on /games/<id>, which is noindexed
 * precisely so it stops outranking the playable page. Content on one URL,
 * ranking on another, and neither doing the other's job.
 *
 * So it moves here: game first, prose underneath, the same shape the homepage
 * already uses. Nobody who came to play is delayed by a single pixel, and the
 * page finally says something to a crawler.
 *
 * The FAQ is emitted as FAQPage schema, which is what can win the expandable
 * questions under a result.
 */
export function GameBelowFold({ id }: { id: ModeId }) {
  const seo = gameSeo(id);
  if (!seo) return null;
  const def = modeDef(id);
  const others = LIVE_MODES.filter((m) => m.id !== id);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 text-[15px] leading-relaxed text-ink">
      <div className="border-t-2 border-ink/15 pt-8">
        <h2 className="font-display text-2xl font-semibold text-ink">
          What is {def.name}?
        </h2>
        {seo.about.map((p) => (
          <p key={p.slice(0, 32)} className="mt-3 text-ink-secondary">
            {p}
          </p>
        ))}

        <h2 className="mt-9 font-display text-2xl font-semibold text-ink">How to play</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-secondary">
          {seo.howToPlay.map((step) => (
            <li key={step.slice(0, 32)}>{step}</li>
          ))}
        </ol>

        <h2 className="mt-9 font-display text-2xl font-semibold text-ink">Scoring</h2>
        <p className="mt-3 text-ink-secondary">{seo.scoring}</p>

        <h2 className="mt-9 font-display text-2xl font-semibold text-ink">Tips and strategy</h2>
        <div className="mt-3 space-y-4">
          {seo.strategy.map((s) => (
            <div key={s.title}>
              <h3 className="font-bold text-ink">{s.title}</h3>
              <p className="mt-1 text-ink-secondary">{s.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-9 font-display text-2xl font-semibold text-ink">
          Questions about {def.name}
        </h2>
        <dl className="mt-3 space-y-4">
          {seo.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-bold text-ink">{f.q}</dt>
              <dd className="mt-1 text-ink-secondary">{f.a}</dd>
            </div>
          ))}
        </dl>

        {/* Cross-links by name. A searcher who arrived for one game has no idea
            the other three exist, and this is the only place that tells them. */}
        <h2 className="mt-9 font-display text-2xl font-semibold text-ink">
          The rest of the card
        </h2>
        <p className="mt-3 text-ink-secondary">
          {def.name} is one of four free puzzles that land every midnight, and whatever you
          score on each adds up to one daily total. You don&apos;t have to play all four.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2.5">
          {others.map((m) => (
            <li key={m.id}>
              <Link
                href={`/${m.id}`}
                className="wonky inline-block border border-ink/30 bg-card px-4 py-2 text-xs font-bold text-ink"
              >
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </section>
  );
}
