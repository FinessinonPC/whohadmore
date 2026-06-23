import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/ui/Logo";

export const dynamic = "force-static";

const DESCRIPTION =
  "WhoHadMore is a free daily comparison game — two cards, one stat, tap whichever had more. Learn how to play, build a streak, and climb the leaderboard.";

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
          <span className="font-semibold text-ink">WhoHadMore</span> is a free
          daily comparison game. Every day you get a fresh higher-or-lower
          puzzle: two cards appear side by side, each showing a person, place, or
          thing, and you simply tap whichever one had{" "}
          <span className="font-semibold text-ink">more</span> of that day&apos;s
          stat — more points, more streams, more calories, more anything.
        </p>

        <div>
          <h2 className="mb-2 text-xl font-extrabold text-ink">How to play</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>You start with three lives and a chain of cards.</li>
            <li>One card&apos;s value is shown; tap the card you think had more.</li>
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
    </main>
  );
}
