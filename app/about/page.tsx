import Link from "next/link";
import type { Metadata } from "next";
import { BrandLockup } from "@/components/ui/Logo";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { LIVE_MODES } from "@/lib/modes";

export const dynamic = "force-static";

const DESCRIPTION =
  "WhoHadMore is a set of quick daily games - the higher-or-lower Chain, Duality, Word and the Mini crossword - with one combined score and a daily leaderboard. Free, in your browser, new every midnight.";

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is WhoHadMore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WhoHadMore is a collection of quick daily games: Chain (the classic higher-or-lower run), Duality (match two meanings of the same word), Word (the daily five-letter game), and Mini (a 5x5 crossword). Every game feeds one combined daily score.",
      },
    },
    {
      "@type": "Question",
      name: "How does the combined score work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each quick game is worth up to 1,000 points and Chain earns points for every correct answer, hearts kept, and speed. Your games add up to one daily total, which is what the daily leaderboard ranks.",
      },
    },
    {
      "@type": "Question",
      name: "Is WhoHadMore free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Everything is free and plays in your browser on phone or desktop, with no download. A free account unlocks the archive of past days.",
      },
    },
    {
      "@type": "Question",
      name: "Is there something new every day?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All four games refresh at midnight - a new Chain topic, new pairs, a new word, and a new crossword grid.",
      },
    },
    {
      "@type": "Question",
      name: "Can I play past days?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes - every past day lives in the archive with all of its games and that day's leaderboard. Sign in with a free account to play them.",
      },
    },
  ],
};

const GAME_BLURBS: Record<string, string> = {
  chain:
    "The original. Two cards, one stat - tap whichever is higher and see how deep you can run on three lives.",
  duality:
    "Eight definitions hide four pairs. Each pair is one word with two meanings - find both and the word reveals.",
  word: "Six tries to find the five-letter word. Green means placed, yellow means present. You know this one.",
  mini: "A bite-size 5x5 crossword. Fill the grid, check your letters, beat the clock in your head.",
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
        <Link href="/">
          <BrandLockup />
        </Link>
        <Link href="/" className="rounded-full bg-cta px-4 py-1.5 text-xs font-semibold text-background">
          Play
        </Link>
      </header>

      <article className="space-y-8 text-[15px] leading-relaxed text-ink-secondary">
        <div>
          <h1 className="font-condensed text-4xl font-semibold uppercase tracking-wide text-ink">
            About WhoHadMore
          </h1>
          <p className="mt-3">
            <span className="font-semibold text-ink">WhoHadMore</span> is a set of quick
            daily games with one score. Every midnight, four fresh games drop - each one
            takes about a minute, and together they make your daily total. Play one, play
            them all, then see where you land on the day&apos;s leaderboard.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-condensed text-2xl font-semibold uppercase tracking-wide text-ink">
            The games
          </h2>
          <ul className="flex flex-col gap-3">
            {LIVE_MODES.map((m) => (
              <li key={m.id} className="rounded-2xl border border-border bg-surface/50 p-4">
                <span style={{ color: m.accent }}>
                  <GameWordmark mode={m.id} className="text-2xl" />
                </span>
                <p className="mt-1.5 text-sm">{GAME_BLURBS[m.id]}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-condensed text-2xl font-semibold uppercase tracking-wide text-ink">
            One score, one board
          </h2>
          <p>
            Each quick game is worth up to 1,000 points; Chain pays for every correct
            answer, heart kept, and quick decision. Your games roll into one daily total,
            and the leaderboard ranks the day by it. Pick a username to save your streak,
            earn XP and achievements, and hold your name on the board.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-condensed text-2xl font-semibold uppercase tracking-wide text-ink">
            The archive
          </h2>
          <p>
            Missed a day? Every past day lives in the{" "}
            <Link href="/archive" className="font-semibold text-ink underline underline-offset-2">
              archive
            </Link>{" "}
            with all of its games and that day&apos;s leaderboard. Signing in (free) unlocks
            it.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className="rounded-2xl bg-cta px-5 py-3 text-sm font-bold text-background">
            Play today&apos;s games
          </Link>
          <Link href="/archive" className="rounded-2xl bg-surface px-5 py-3 text-sm font-bold text-ink">
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
