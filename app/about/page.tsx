import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/ui/Logo";

export const dynamic = "force-static";

const DESCRIPTION =
  "WhoHadMore is a free daily higher-or-lower game - two cards, one stat, tap whichever is higher. Learn how to play, build a streak, and climb the leaderboard.";

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is WhoHadMore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WhoHadMore is a free daily higher-or-lower game. Each day you get a new puzzle: two cards appear, each showing a person, place, or thing, and you tap whichever one is higher on that day's stat.",
      },
    },
    {
      "@type": "Question",
      name: "How do you play WhoHadMore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You start with three lives and a chain of cards. One card's value is shown; tap the card you think is higher. A correct guess moves you down the chain and a wrong guess costs a life.",
      },
    },
    {
      "@type": "Question",
      name: "Is WhoHadMore free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. WhoHadMore is completely free and plays in your browser on phone or desktop, with no download.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a new puzzle every day?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. A brand-new puzzle drops every day at midnight, spanning sports, pop culture, food, geography, science, and more.",
      },
    },
    {
      "@type": "Question",
      name: "Can I play past WhoHadMore puzzles?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every past puzzle lives in the archive and is always playable.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: "About WhoHadMore", description: DESCRIPTION, url: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <header className="mb-10 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5">
          <BrandMark className="h-5 w-5" />
          <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
        </Link>
        <Link href="/" className="rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-white">
          Play
        </Link>
      </header>

      <article className="space-y-6 text-[15px] leading-relaxed text-ink-secondary">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">About WhoHadMore</h1>

        <p>
          <span className="font-semibold text-ink">WhoHadMore</span> is a daily
          higher-or-lower game. Every day you get a fresh puzzle: two cards appear
          side by side, each showing a person, place, or thing, and you simply tap{" "}
          <span className="font-semibold text-ink">whichever is higher</span> on
          that day&apos;s stat - more points, taller, faster, whatever it is.
        </p>

        <div>
          <h2 className="mb-2 text-xl font-extrabold text-ink">How to play</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>You start with three lives and a chain of cards.</li>
            <li>One card&apos;s value is shown; tap the card you think is higher.</li>
            <li>A correct guess moves you down the chain. A wrong guess costs a life.</li>
            <li>The further you make it, the more XP you earn.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-extrabold text-ink">Streaks, XP &amp; the leaderboard</h2>
          <p>
            Pick a username to save your progress. Playing every day builds a
            streak that quietly multiplies your XP, and your monthly score puts
            you on the global leaderboard. Earn hearts for careful play and unlock
            achievements as you go.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-extrabold text-ink">A new puzzle daily</h2>
          <p>
            A brand-new game drops every day at midnight, spanning sports, pop
            culture, food, geography, science, and the genuinely surprising.
            Missed a day? Every past puzzle lives in the{" "}
            <Link href="/archive" className="font-semibold text-ink underline underline-offset-2">
              archive
            </Link>{" "}
            and is always playable.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className="rounded-2xl bg-cta px-5 py-3 text-sm font-bold text-white">
            Play today&apos;s game
          </Link>
          <Link
            href="/archive"
            className="rounded-2xl bg-surface px-5 py-3 text-sm font-bold text-ink"
          >
            Browse the archive
          </Link>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
    </main>
  );
}
