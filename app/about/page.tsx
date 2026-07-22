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
        text: "Every game is worth up to 1,000 points. Whatever you finish adds up to one daily total, and the daily leaderboard ranks the day by it. Play a single game or all four - it all counts.",
      },
    },
    {
      "@type": "Question",
      name: "Is WhoHadMore free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Everything is free and plays in your browser on phone or desktop, with no download. A free account saves your streak, XP and badges and unlocks the archive of past days.",
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
        text: "Yes - every past day lives in the archive with all of its games and that day's leaderboard, and it still earns XP and points toward your totals. Sign in with a free account to play them.",
      },
    },
  ],
};

const GAME_BLURBS: Record<string, string> = {
  chain: "Higher or lower. Two cards, one stat. Call it right and keep the run going as far as you can.",
  duality: "Eight clues hide four pairs. Each pair is a single word wearing two unrelated meanings.",
  word: "Six tries at the five-letter word. Green is placed, yellow is close. You already know this one.",
  mini: "A five-by-five crossword, sized for a coffee break. Fill the grid, beat the clock in your head.",
};

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: "About WhoHadMore", description: DESCRIPTION, url: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-6">
      {/* utility bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Link href="/" aria-label="WhoHadMore home">
          <BrandLockup />
        </Link>
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:text-ink"
        >
          Play today
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </Link>
      </div>

      {/* ---- masthead: a printed nameplate, not a card ---- */}
      <section className="pt-10 text-center">
        <p className="small-caps text-[10px] font-bold tracking-[0.22em] text-ink-secondary">
          The daily puzzle
        </p>
        <div className="mt-3 border-y-2 border-ink py-3">
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-ink sm:text-6xl">
            WhoHadMore
          </h1>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-ink-secondary">
          <span>Est. 2026</span>
          <span className="hidden sm:inline">New every midnight</span>
          <span>Free to play</span>
        </div>
      </section>

      {/* ---- lede + maker's note ---- */}
      <section className="pt-12">
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.5rem] sm:leading-[1.05]">
          Four small games.
          <br className="hidden sm:block" /> One daily score.
        </h2>
        <p className="mt-2 font-condensed text-lg text-ink-secondary">
          A puzzle worth showing up for, and the quiet pull of tomorrow&apos;s.
        </p>

        <div className="mt-6 text-[17px] leading-relaxed text-ink-secondary">
          <p>
            <span
              aria-hidden
              className="float-left mr-2 mt-1 font-condensed text-6xl leading-[0.72] text-ink"
            >
              E
            </span>
            very midnight, four fresh games drop. Each one takes about a minute, and together they
            make your score for the day. There&apos;s no feed to fall into and nothing to install.
            You open the page, you play, you get on with your morning.
          </p>
          <p className="mt-4">
            That&apos;s the whole idea: a small, honest ritual you can actually finish, then compare
            with everyone else who played the same four games today.
          </p>
        </div>
      </section>

      {/* ---- the games, as a contents index ---- */}
      <section className="pt-14">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Inside today&apos;s edition
          </h2>
          <span className="small-caps text-[10px] font-bold text-ink-secondary">Four games</span>
        </div>

        <ol>
          {LIVE_MODES.map((m, i) => (
            <li
              key={m.id}
              className="flex items-start gap-4 border-b border-border py-5 last:border-b-0"
            >
              <span className="mt-0.5 w-8 shrink-0 font-display text-2xl font-bold tabular text-ink/25">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <span style={{ color: m.accent }}>
                  <GameWordmark mode={m.id} className="text-2xl" />
                </span>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-secondary">
                  {GAME_BLURBS[m.id]}
                </p>
              </div>
              <span className="mt-1 hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-secondary sm:block">
                &asymp; 1 min
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- scoring: a ruled ledger strip, no box ---- */}
      <section className="pt-14">
        <h2 className="font-display text-2xl font-semibold text-ink">One score, one board</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-secondary">
          Every game is worth up to <span className="marker-gold font-semibold text-ink">1,000</span>{" "}
          points. Add them up and that&apos;s your day: the number the leaderboard ranks. Play a
          single game or all four; whatever you finish counts. Claim a free username and your streak,
          XP and badges carry from day to day, on any device.
        </p>
        <dl className="mt-6 grid grid-cols-3 border-y-2 border-ink">
          {[
            ["Up to 1,000", "per game"],
            ["Four games", "a day"],
            ["One total", "on the board"],
          ].map(([big, small], i) => (
            <div
              key={big}
              className={`px-3 py-4 text-center ${i > 0 ? "border-l border-border" : ""}`}
            >
              <dt className="font-display text-lg font-bold leading-none text-ink">{big}</dt>
              <dd className="mt-1 small-caps text-[10px] font-bold text-ink-secondary">{small}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- pull quote ---- */}
      <section className="py-16 text-center">
        <p className="mx-auto max-w-md font-condensed text-[26px] leading-[1.3] text-ink">
          No feed. No notifications. No clock in the corner.
          <span className="text-ink-secondary"> Just today&apos;s card. And tomorrow, a fresh one.</span>
        </p>
      </section>

      {/* ---- archive ---- */}
      <section className="border-t border-border pt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">The archive</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-secondary">
          Miss a day? It doesn&apos;t disappear. The{" "}
          <Link href="/archive" className="font-semibold text-ink underline decoration-2 underline-offset-2">
            archive
          </Link>{" "}
          keeps every past edition, all four games and that day&apos;s final board, and it
          still earns XP and points toward your totals. A free account opens it up.
        </p>
        <p className="mt-8 text-right font-condensed text-xl text-ink">
          Made for people who like a good puzzle.
        </p>
      </section>

      {/* ---- footer CTA ---- */}
      <section className="mt-12 flex flex-col items-center gap-4 border-t-2 border-ink pt-10 sm:flex-row sm:justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-base font-bold text-background transition-transform active:translate-y-0.5"
        >
          Play today&apos;s games
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            &rarr;
          </span>
        </Link>
        <Link
          href="/archive"
          className="text-sm font-bold uppercase tracking-[0.12em] text-ink-secondary underline decoration-2 underline-offset-4 transition-colors hover:text-ink"
        >
          Browse the archive
        </Link>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
    </main>
  );
}
