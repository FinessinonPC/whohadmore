"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { GameWordmark } from "@/components/ui/GameWordmarks";
import { useProfile } from "@/hooks/useProfile";
import { getSessionId } from "@/lib/playStore";
import { startRun } from "@/lib/runStore";
import { LIVE_MODES, modeDef } from "@/lib/modes";
import { formatDisplayDate } from "@/lib/date";
import { trackEvent } from "@/lib/clientTrack";
import type { DealtCard } from "@/app/api/archive/random/route";

/**
 * The deal.
 *
 * Signed in: pick a card and go straight into it - the deal should feel like a
 * shuffle, not a landing page.
 *
 * Signed out: the wall, but AFTER the tap. They've already decided they want a
 * card, and the one they've been dealt is face up in front of them with its
 * four games showing. Asking then is a much better ask than a generic sign-up
 * prompt shown before they wanted anything.
 */
export function RandomDeal() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [card, setCard] = useState<DealtCard | null>(null);
  const [none, setNone] = useState(false);

  const signedIn = Boolean(profile?.username);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    trackEvent("deal_dealt", { surface: signedIn ? "signed_in" : "signed_out" });
    void fetch(`/api/archive/random?session=${getSessionId()}`)
      .then((r) => r.json())
      .then((d: { card?: DealtCard; none?: boolean }) => {
        if (cancelled) return;
        if (!d.card) {
          setNone(true);
          return;
        }
        setCard(d.card);
        // Signed in: don't linger - start the run and open the card.
        if (signedIn) {
          startRun();
          router.replace(`/day/${d.card.date}`);
        }
      })
      .catch(() => {
        if (!cancelled) setNone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, signedIn, router]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-game flex-col justify-center px-4 pb-12 pt-6">
        {none ? (
          <div className="card-ink tilt-l px-5 py-7 text-center">
            <p className="font-condensed text-[22px] font-semibold leading-tight text-ink">
              Nothing left to deal.
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-ink-secondary">
              You&apos;ve played every published card. A new one lands at midnight.
            </p>
            <Link
              href="/"
              className="ink-fix wonky mt-4 flex items-center justify-center border-2 border-ink bg-[#F8E6A2] px-4 py-3 text-[15px] font-bold text-ink ink-shadow-sm"
            >
              Back to today&apos;s card
            </Link>
          </div>
        ) : !card || signedIn ? (
          <p className="py-16 text-center font-condensed text-2xl font-semibold text-ink-secondary">
            Dealing…
          </p>
        ) : (
          <motion.div
            className="card-ink tilt-l px-5 pb-5 pt-5 text-center"
            initial={{ opacity: 0, y: 18, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -0.7 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            <span className="stamp-red">Your card is dealt</span>

            <div className="card-ink-flat mt-4 px-4 py-3.5">
              <span className="small-caps block text-[10px] font-bold text-ink-secondary">
                Card No. {card.gameNumber} · {formatDisplayDate(card.date)}
              </span>
              <span className="mt-1 block font-condensed text-[24px] font-semibold leading-tight text-ink">
                {card.topicLabel}
              </span>
              <div className="mt-2.5 flex justify-center gap-2">
                {LIVE_MODES.map((m) => (
                  <span
                    key={m.id}
                    className="ink-fix wonky border-2 border-ink px-2 py-1"
                    style={{ background: m.pastel }}
                  >
                    <GameWordmark mode={m.id} className="h-[11px] text-ink" alt={modeDef(m.id).accent} />
                  </span>
                ))}
              </div>
            </div>

            <p className="mx-auto mt-4 max-w-[17rem] text-[13px] leading-relaxed text-ink-secondary">
              Past cards are free — an account is all that stands between you and this one, and it
              keeps every score you bank.
            </p>

            <Link
              href="/profile"
              onClick={() => trackEvent("deal_signin_click", { surface: "deal_wall", date: card.date })}
              className="ink-fix wonky mt-4 flex items-center justify-center border-2 border-ink bg-[#F8E6A2] px-4 py-3.5 text-[15px] font-bold text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Sign in and play it →
            </Link>
            <Link
              href="/"
              className="small-caps mt-2.5 block py-1 text-[10px] font-bold text-ink-secondary transition-colors hover:text-ink"
            >
              Back to today
            </Link>
          </motion.div>
        )}
      </main>
    </>
  );
}
