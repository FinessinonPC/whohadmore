import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { LEGAL } from "@/lib/legal";

export const dynamic = "force-static";
export const revalidate = 86400;

const DESCRIPTION =
  "The terms for using WhoHadMore: it's free, it's provided as-is, don't cheat or scrape it, and you own nothing you break.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service · WhoHadMore", description: DESCRIPTION, url: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-ink">
          Terms of Service
        </h1>
        <p className="mt-1 text-[13px] font-semibold text-ink-secondary">
          Last updated {LEGAL.lastUpdated}
        </p>

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-ink">
          <section>
            <p>
              By using WhoHadMore you agree to what follows. It is short because the service is
              simple: four free puzzles a day, no payment, no subscription.
            </p>
          </section>

          <Section title="The service">
            <p>
              WhoHadMore is free to play and provided as-is. We may change the games, the scoring,
              the leaderboards or any other part of the site, and we may suspend or discontinue it
              entirely, without notice and without liability to you. Nothing here is a promise that
              the site will be available, or that any puzzle, score or streak will be preserved.
            </p>
          </Section>

          <Section title="Accounts">
            <p>
              An account is optional and free. You are responsible for the email address you sign in
              with and for activity under your account. Pick a username that is not impersonating
              someone, not abusive, and not something you would mind appearing on a public
              leaderboard — because it will.
            </p>
            <p className="mt-3">
              We may remove a username or close an account that breaks these terms. You can delete
              your own account at any time from your profile.
            </p>
          </Section>

          <Section title="Fair play">
            <p>Do not:</p>
            <List
              items={[
                "use bots, scripts or automation to play, or to submit scores you did not earn",
                "manipulate the leaderboards, or create accounts to do so",
                "scrape, bulk-download or republish the puzzles or their answers",
                "attempt to break, overload or gain unauthorised access to the site or its database",
                "reverse-engineer the site to obtain unpublished puzzle content in advance",
              ]}
            />
            <p className="mt-3">
              Scores obtained in these ways may be removed without notice, along with the account
              behind them.
            </p>
          </Section>

          <Section title="Who owns what">
            <p>
              The puzzles, the games, the writing, the design and the name WhoHadMore belong to{" "}
              {LEGAL.operator}. You may play them, and you may share your results — that is what the
              share button is for. You may not republish the puzzle content itself, or build a
              competing product from it.
            </p>
            <p className="mt-3">
              Names, teams and facts used inside the puzzles are used descriptively and remain the
              property of whoever they belong to. Nothing here claims otherwise, and nothing here
              implies any endorsement.
            </p>
          </Section>

          <Section title="No warranty">
            <p>
              The site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
              warranties of any kind, express or implied, including fitness for a particular purpose
              and non-infringement. We do not warrant that the site will be uninterrupted, that it
              will be error-free, or that the puzzles are free of mistakes — a wrong answer in a
              crossword is a disappointment, not a breach of contract.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the fullest extent the law allows, {LEGAL.operator} is not liable for any indirect,
              incidental, special or consequential damages arising from your use of the site,
              including lost data, lost scores, or lost streaks. Where liability cannot be excluded,
              it is limited to the amount you have paid to use WhoHadMore, which is nothing.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms. The date at the top will change, and continuing to use the
              site after that means you accept the revision. If a change is material we will say so
              on the site rather than slipping it in.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms are governed by the laws of {LEGAL.jurisdiction}, without regard to
              conflict-of-law rules.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              {LEGAL.operator} —{" "}
              <a
                href={`mailto:${LEGAL.contactEmail}`}
                className="underline decoration-2 underline-offset-4"
              >
                {LEGAL.contactEmail}
              </a>
            </p>
          </Section>
        </div>

        <p className="mt-10 text-center text-[13px] text-ink-secondary">
          <Link href="/privacy" className="underline decoration-2 underline-offset-4">
            Privacy Policy
          </Link>
        </p>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-secondary">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
