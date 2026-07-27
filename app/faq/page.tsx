import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400;

const DESCRIPTION =
  "Answers about WhoHadMore: what the games are, how scoring and the leaderboard work, whether it's free, how the archive works, and when new puzzles drop.";

export const metadata: Metadata = {
  title: "FAQ - Questions About WhoHadMore",
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: { title: "FAQ · WhoHadMore", description: DESCRIPTION, url: "/faq" },
};

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "What is WhoHadMore?",
    a: "WhoHadMore is a free set of four quick daily games: Chain (a higher-or-lower run), Duality (find four pairs of double meanings), Word (six tries at a five-letter word), and the Mini (a 5x5 crossword). All four refresh every midnight and feed one combined daily score.",
  },
  {
    q: "Is WhoHadMore free?",
    a: "Yes, entirely. Every game is free to play in your browser on phone or desktop, with no download and no payment. Creating an account is optional and also free.",
  },
  {
    q: "Do I need an account to play?",
    a: "No. You can play every day's games without signing up. A free account saves your streak, XP, achievements and per-game stats across devices, and puts your name on the leaderboard instead of an anonymous label.",
  },
  {
    q: "How does scoring work?",
    a: "Every game is worth up to 1,000 points. Whatever you finish adds up to your total for that day, and the daily leaderboard ranks players by that combined number. You don't have to play all four - a single game still counts.",
  },
  {
    q: "What is the difference between points and XP?",
    a: "Points are your score for a given day and what the leaderboards rank. XP is a separate lifetime track that levels up your profile over time and carries a small bonus for playing on consecutive days.",
  },
  {
    q: "When do new puzzles come out?",
    a: "All four games refresh at midnight: a new Chain topic, new Duality pairs, a new five-letter word, and a fresh Mini crossword grid.",
  },
  {
    q: "Can I play puzzles from previous days?",
    a: "Yes. Every past day lives in the archive with its full set of games and that day's final leaderboard. Archive plays still earn points and XP toward your totals. Signing in with a free account unlocks the archive.",
  },
  {
    q: "How do streaks work?",
    a: "Playing on consecutive days builds a streak, which adds a small XP bonus that grows the longer it runs. Any game counts toward keeping a streak alive - you don't have to finish all four.",
  },
  {
    q: "What happens if I miss a day?",
    a: "Nothing is lost except the streak itself. Your points, XP and achievements stay exactly as they were, and the day you missed is still playable from the archive.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. There's a delete option on your profile page that permanently removes your account, scores and email.",
  },
];

export default function FaqPage() {
  const base = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: "FAQ", item: `${base}/faq` },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-5">

      <header className="mt-8">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-secondary">
          Everything about how WhoHadMore works. If your question isn&apos;t here, the{" "}
          <Link href="/about" className="font-semibold text-ink underline decoration-2 underline-offset-2">
            about page
          </Link>{" "}
          covers the rest.
        </p>
      </header>

      <dl className="mt-8">
        {FAQS.map((f) => (
          <div key={f.q} className="border-b border-border py-5 last:border-b-0">
            <dt className="font-display text-lg font-semibold text-ink">{f.q}</dt>
            <dd className="mt-2 text-[16px] leading-relaxed text-ink-secondary">{f.a}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10 border-t-2 border-ink pt-8">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
          <Link href="/" className="text-ink underline decoration-2 underline-offset-4">
            Play today&apos;s card
          </Link>
          <Link href="/games" className="text-ink underline decoration-2 underline-offset-4">
            The games
          </Link>
          <Link href="/archive" className="text-ink underline decoration-2 underline-offset-4">
            Past puzzles
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
    </>
  );
}
