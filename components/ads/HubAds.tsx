"use client";

import { useEffect, useState } from "react";
import { SLOT_BOTTOM, SLOT_SIDE, hasSlot } from "@/lib/ads";
import { AdScript, AdUnit } from "./AdUnit";

/**
 * Breakpoints answered in JS, not with `xl:hidden`.
 *
 * A CSS-hidden unit is still in the DOM, so the tag gets pushed and AdSense
 * fills a container nobody can see - an impression that is never viewable.
 * Google treats ads in hidden containers as a policy problem, and viewability
 * is what the RPM eventually rests on, so a phone must not carry a desktop
 * unit at all.
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
 * Both placements sit in the page rather than over it. Nothing is fixed to the
 * viewport, so no ad can cover the thing someone came to do.
 */
export function HubAds() {
  return (
    <>
      <AdScript />
      <SideRail />
      <BottomAd />
    </>
  );
}

/**
 * The bottom ad: a banner in the flow, under the cards, on every screen.
 *
 * It was a sticky bar pinned to the viewport on phones, and that was a mistake
 * twice over. `height: 60` did nothing, because a responsive format ignores it
 * and AdSense returns whatever size it likes - on a phone that meant a fixed
 * panel over half the screen. And dismissal lived in sessionStorage, which on
 * mobile survives as long as the tab does, so "not now" read as "never again".
 *
 * In the flow, neither can happen: it cannot cover anything because it is part
 * of the page, and there is nothing to dismiss. `horizontal` asks AdSense for
 * banner shapes rather than large rectangles, so it stays a strip instead of
 * growing into a block.
 */
function BottomAd() {
  if (!hasSlot(SLOT_BOTTOM)) return null;
  return (
    <aside aria-label="Advertisement" className="mt-8 w-full" style={{ minHeight: 100 }}>
      <Label />
      <AdUnit slot={SLOT_BOTTOM} format="horizontal" />
    </aside>
  );
}

/**
 * Beside the column, on screens wide enough to have room going spare.
 *
 * 1280px: 540 for the card leaves 370 each side, so a 160-wide rail sits clear
 * of the content. Fixed position, but out in the margin where there is nothing
 * to cover - and pointer-events stay on the ad itself so the empty margin never
 * swallows a click meant for the page.
 *
 * Dormant until its own slot id is set, which it is not yet.
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

function Label() {
  return (
    <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-widest text-ink-secondary/60">
      Advertisement
    </p>
  );
}
