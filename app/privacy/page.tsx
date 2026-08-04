import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { LEGAL } from "@/lib/legal";

export const dynamic = "force-static";
export const revalidate = 86400;

const DESCRIPTION =
  "What WhoHadMore stores, why, and how to get rid of it. No ads, no data sold, no third-party trackers beyond privacy-friendly analytics.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy · WhoHadMore", description: DESCRIPTION, url: "/privacy" },
};

/**
 * Written against what the code actually does, not a template.
 *
 * Every claim here is checkable: the storage keys are in lib/playStore and
 * lib/cardsCompleted, the tables in supabase/migrations, the only third
 * parties in the CSP in middleware.ts. If any of those change, this page is
 * wrong and needs changing with them - an inaccurate privacy policy is worse
 * than no privacy policy, because it is a statement rather than a silence.
 */
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-ink">
          Privacy Policy
        </h1>
        <p className="mt-1 text-[13px] font-semibold text-ink-secondary">
          Last updated {LEGAL.lastUpdated}
        </p>

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-ink">
          <section>
            <p>
              WhoHadMore is a free daily puzzle site. It carries no advertising, sells no data, and
              loads no third-party tracking pixels. This page describes everything it does store.
            </p>
          </section>

          <Section title="Playing without an account">
            <p>
              You can play every day without giving us anything. When you first load the site your
              browser generates a random session identifier and keeps it in local storage, with a
              copy in a cookie so the server can tell which card is yours. It is a random string. It
              is not derived from your device, your network, or anything about you, and on its own it
              identifies nobody.
            </p>
            <p className="mt-3">Tied to that identifier, we store the results of games you finish:</p>
            <List
              items={[
                "which day's card, and which of the four games you played",
                "your score, and for some games how long you took and how many mistakes you made",
                "your streak, level and achievements",
              ]}
            />
            <p className="mt-3">
              Your browser also keeps a few things locally that never reach us: your progress in an
              unfinished game, which days you have completed, and whether you dismissed the prompt
              asking if you would like the site on your home screen.
            </p>
          </Section>

          <Section title="If you create an account">
            <p>
              Accounts are optional. Signing in sends a one-time link to your email address, so we
              store that address. We never receive or store a password, because there isn&apos;t
              one. Alongside it we keep the username you choose and the game history above, now
              attached to your account so it follows you between devices.
            </p>
            <p className="mt-3">
              <strong className="font-bold">Your username is public.</strong> It appears on the daily
              and all-time leaderboards where anyone can see it. Nothing else about you is shown -
              not your email, not when you play. Choose a username accordingly.
            </p>
          </Section>

          <Section title="Analytics">
            <p>We measure two things, both about the site rather than about you:</p>
            <List
              items={[
                "Vercel Analytics, which counts page views and is cookieless by design - it does not build a profile of you or follow you to other sites",
                "our own counter, which records events like \"a results pop-up was shown\" or \"someone tapped share\", stored against the same random session identifier",
              ]}
            />
            <p className="mt-3">
              We use these to answer questions like whether people finish all four games. Neither is
              shared with anyone, and neither is used for advertising.
            </p>
          </Section>

          <Section title="Who else touches your data">
            <p>
              Two companies, both acting on our behalf under their own privacy terms:{" "}
              <strong className="font-bold">Vercel</strong>, which hosts the site and provides the
              analytics above, and <strong className="font-bold">Supabase</strong>, which stores the
              database and sends the sign-in emails. That is the complete list. We do not sell,
              rent, or trade any of it.
            </p>
          </Section>

          <Section title="Deleting everything">
            <p>
              If you have an account, the danger zone at the bottom of your{" "}
              <Link href="/profile" className="underline decoration-2 underline-offset-4">
                profile
              </Link>{" "}
              deletes it, along with your scores, streak and achievements. It is immediate and it is
              not reversible.
            </p>
            <p className="mt-3">
              Without an account, clearing your browser&apos;s site data for whohadmore.com removes
              the session identifier and everything stored locally. Results already recorded against
              the old identifier stay in the database but are no longer connected to any device.
            </p>
            <p className="mt-3">
              Depending on where you live you may also have the right to ask what we hold about you,
              to correct it, or to have it erased. Email{" "}
              <a
                href={`mailto:${LEGAL.contactEmail}`}
                className="underline decoration-2 underline-offset-4"
              >
                {LEGAL.contactEmail}
              </a>{" "}
              and we will action it.
            </p>
          </Section>

          <Section title="Children">
            <p>
              WhoHadMore is not directed at children under 13 and we do not knowingly collect their
              information. If you believe a child under 13 has created an account, email us and we
              will remove it.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              If this policy changes we will update the date at the top. Material changes will be
              flagged on the site rather than made quietly.
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
          <Link href="/terms" className="underline decoration-2 underline-offset-4">
            Terms of Service
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
