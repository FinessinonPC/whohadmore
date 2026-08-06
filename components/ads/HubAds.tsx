"use client";

import { useEffect, useState } from "react";
import { SLOT_ANCHOR, SLOT_INFLOW, SLOT_SIDE, hasSlot } from "@/lib/ads";
import { AdScript, AdUnit } from "./AdUnit";

const DISMISS_KEY = "whm_anchor_ad_hidden";

/**
 * Breakpoints have to be answered in JS here, not with `lg:hidden`.
 *
 * A CSS-hidden unit is still in the DOM, so the tag gets pushed and AdSense
 * fills a container nobody can see - an impression that is never viewable.
 * Google treats ads in hidden containers as a policy problem, and viewability
 * is what the RPM eventually rests on, so a phone must not carry the desktop
 * units at all and vice versa.
 *
 * Returns null until measured, so nothing is pushed before it is known whether
 * it belongs on this screen.
 */
function useMedia(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

/**
 * Every ad on the site, and they all live on the card screen.
 *
 * Deliberately nowhere else. The card screen is a menu - you pick a game and
 * leave - so an ad here interrupts nobody mid-puzzle, which an ad inside Chain
 * or the Mini would. It is also the page people return to between games, so it
 * is the most-seen surface on the site without being the most intrusive.
 *
 * Three placements, each independently dormant until its slot id is set:
 *
 *   mobile   a sticky banner pinned to the bottom, which the reader can push
 *            back down. Phones have no margins to spare, so a fixed banner is
 *            the only placement that doesn't shove the cards around.
 *   desktop  a rail beside the 540px column, in space that is otherwise empty,
 *            plus one in the flow under the cards.
 *
 * The two are exclusive by breakpoint - nobody gets a sticky banner AND a rail.
 */
export function HubAds() {
  return (
    <>
      <AdScript />
      <SideRail />
      <InFlowAd />
      <AnchorAd />
    </>
  );
}

/** Under the cards, in the flow. Desktop only - on a phone this competes with
 *  the sticky banner, and two ads on one small screen is one too many. */
function InFlowAd() {
  const desktop = useMedia("(min-width: 1024px)");
  if (!hasSlot(SLOT_INFLOW) || !desktop) return null;
  return (
    <aside aria-label="Advertisement" className="mt-8 w-full">
      <Label />
      <AdUnit slot={SLOT_INFLOW} />
    </aside>
  );
}

/**
 * Beside the column, on screens wide enough to have room going spare.
 *
 * xl is 1280px: 540 for the card leaves 370 each side, so a 160-wide rail sits
 * clear of the content with room to breathe. Fixed rather than in-flow so it
 * stays put while the cards scroll, and pointer-events stay on the ad itself so
 * the empty margin never swallows a click meant for the page.
 */
function SideRail() {
  const wide = useMedia("(min-width: 1280px)");
  if (!hasSlot(SLOT_SIDE) || !wide) return null;
  return (
    <aside
      aria-label="Advertisement"
      className="pointer-events-none fixed top-1/2 z-10 -translate-y-1/2"
      style={{ left: "calc(50% + 270px + 32px)", width: 160 }}
    >
      <div className="pointer-events-auto">
        <Label />
        <AdUnit slot={SLOT_SIDE} format="vertical" responsive={false} style={{ width: 160, height: 600 }} />
      </div>
    </aside>
  );
}

/**
 * The sticky one, phones only.
 *
 * Dismissible because it should be: it sits over the page, and a banner you
 * cannot get rid of on a small screen is the kind of thing that makes people
 * leave rather than the kind that makes money. Dismissal is remembered for the
 * session only - sessionStorage, not local - so it is gone for as long as
 * someone is annoyed by it and back on their next visit.
 */
function AnchorAd() {
  // Starts hidden and is revealed on the client, so a dismissal made on the
  // hub survives walking into a game and back - without it the banner would
  // reappear on every return, which is the behaviour people actually resent.
  const desktop = useMedia("(min-width: 1024px)");
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (!hasSlot(SLOT_ANCHOR) || hidden || desktop !== false) return null;

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: it just comes back on the next render, which is fine */
    }
    setHidden(true);
  };

  return (
    <>
    {/* Fixed elements sit over the page, so the footer links would end up
        underneath the banner with no way to reach them. This reserves the
        height back. */}
    <div className="h-[76px]" aria-hidden />
    <aside
      aria-label="Advertisement"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/15 bg-background/95 backdrop-blur"
    >
      <button
        onClick={dismiss}
        aria-label="Hide advertisement"
        className="absolute -top-6 right-2 flex h-6 w-9 items-center justify-center rounded-t border-2 border-b-0 border-ink/15 bg-background/95 text-ink-secondary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="px-2 pb-1 pt-0.5">
        <AdUnit slot={SLOT_ANCHOR} format="horizontal" style={{ height: 60 }} />
      </div>
    </aside>
    </>
  );
}

function Label() {
  return (
    <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-widest text-ink-secondary/60">
      Advertisement
    </p>
  );
}
