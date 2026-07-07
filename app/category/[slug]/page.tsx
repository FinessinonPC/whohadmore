import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/ui/TopNav";
import { ArchiveList } from "@/components/archive/ArchiveList";
import { getCategorySeo } from "@/lib/categories";
import { getPublishedGamesWithNumbers } from "@/lib/games";
import { getSiteUrl } from "@/lib/site";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategorySeo(slug);
  if (!cat) return { title: "Category not found" };
  const title = `${cat.label} Higher or Lower`;
  const description = `${cat.intro} A new ${cat.label.toLowerCase()} puzzle in the rotation every day - free, no download.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title: `${title} - WhoHadMore`, description, url: `/category/${cat.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategorySeo(slug);
  if (!cat) notFound();

  const all = await getPublishedGamesWithNumbers(todayISO());
  const games = all.filter((g) => g.topic_category === cat.slug);
  const base = getSiteUrl();
  const catLower = cat.label.toLowerCase();

  const faqs = [
    {
      q: `What is ${cat.label} Higher or Lower?`,
      a: `${cat.label} Higher or Lower is a free daily guessing game: two cards appear with one stat, and you tap whichever is higher. ${cat.intro}`,
    },
    {
      q: `Is there a new ${catLower} puzzle every day?`,
      a: `WhoHadMore publishes a fresh puzzle every day, and ${catLower} match-ups are part of the rotation. Every past puzzle stays playable here in the archive.`,
    },
    {
      q: `Is it free to play?`,
      a: `Yes - completely free, right in your browser on phone or desktop, with no download or sign-up required.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "WhoHadMore", item: base },
          { "@type": "ListItem", position: 2, name: "Categories", item: `${base}/category` },
          { "@type": "ListItem", position: 3, name: cat.label, item: `${base}/category/${cat.slug}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `${cat.label} Higher or Lower`,
        description: cat.intro,
        url: `${base}/category/${cat.slug}`,
        isPartOf: { "@type": "WebSite", name: "WhoHadMore", url: base },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:max-w-4xl">
      <TopNav />

      <nav className="mt-6 text-xs text-ink-secondary">
        <Link href="/category" className="font-semibold underline underline-offset-2 hover:text-ink">
          Categories
        </Link>{" "}
        / <span className="text-ink">{cat.label}</span>
      </nav>

      <div className="mb-6 mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {cat.label} Higher or Lower
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-secondary">{cat.intro}</p>
        <p className="mt-2 text-sm font-semibold text-ink-secondary">
          {games.length} {games.length === 1 ? "puzzle" : "puzzles"} and counting - updated daily.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link href="/" className="rounded-full bg-cta px-4 py-2 text-xs font-bold text-background">
            Play today&apos;s game
          </Link>
          <Link href="/category" className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink">
            All categories
          </Link>
        </div>
      </div>

      {games.length > 0 ? (
        <ArchiveList games={games} />
      ) : (
        <p className="rounded-2xl border border-border bg-surface/50 py-12 text-center text-sm text-ink-secondary">
          No {catLower} puzzles published yet - a new one could drop any day. In the meantime,{" "}
          <Link href="/" className="font-semibold text-ink underline underline-offset-2">
            play today&apos;s game
          </Link>
          .
        </p>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-xl font-extrabold tracking-tight text-ink">Frequently asked</h2>
        <dl className="mt-4 space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-bold text-ink">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-secondary">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
