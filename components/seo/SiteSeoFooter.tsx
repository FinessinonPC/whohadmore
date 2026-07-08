import { LIVE_MODES } from "@/lib/modes";
import { getSiteUrl } from "@/lib/site";

/**
 * A single crawlable line + structured data for the homepage. Deliberately
 * minimal - the games are the page, not marketing copy. (Per-puzzle SEO still
 * lives on the individual game/day pages.)
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
    <section className="px-5 pb-8">
      <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-ink-secondary/70">
        WhoHadMore is a free set of quick daily games - Chain, Duality, Word, and the
        Mini crossword - with one combined score and a fresh set every midnight.
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
