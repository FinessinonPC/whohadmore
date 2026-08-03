"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/clientTrack";
import {
  canInstall,
  isIOS,
  isStandalone,
  showInstallPrompt,
  subscribeInstall,
} from "@/lib/installPrompt";

const KEY = "whm_keep_handy";

/** Two asks, ever. The first card, then the fifth - and nothing after that. */
const ASK_ON_CARDS = [1, 5];

const isDone = () => {
  try {
    return window.localStorage.getItem(KEY) === "done";
  } catch {
    return false;
  }
};
const markDone = () => {
  try {
    window.localStorage.setItem(KEY, "done");
  } catch {
    /* private mode: it may ask once more, which is the safe way to fail */
  }
};

/** The iOS share glyph, which people recognise far faster than the words. */
const ShareGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden
    className="inline-block h-[1.05em] w-[1.05em] -translate-y-[1px] align-middle"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3.5v11" />
    <path d="M8.2 7.3 12 3.5l3.8 3.8" />
    <path d="M5.5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6.5" />
  </svg>
);

/**
 * Offer to put the site on the player's home screen.
 *
 * Deliberately narrow. It appears on the first completed card and the fifth,
 * and never again - say yes and it stops immediately. It also never appears
 * unless adding to the home screen is genuinely possible: a real install
 * prompt, or iOS where the Share sheet can do it. Desktop browsers without an
 * install prompt see nothing at all, because the honest ask there is "press
 * Ctrl+D", which is a worse thing to read than silence.
 *
 * On iPhone this is more than a shortcut. iOS only delivers web push to sites
 * that have been added to the home screen, so for half this audience this is
 * the one route that ever allows a reminder. Which is also why it is worth
 * showing the actual Share glyph rather than describing it.
 */
export function KeepHandy({ date, cardCount }: { date: string; cardCount: number }) {
  const installable = useSyncExternalStore(subscribeInstall, canInstall, () => false);

  // Decided once, on mount: is this player, on this card, someone to ask?
  const [eligible, setEligible] = useState(false);
  const [ios, setIOS] = useState(false);
  const [closed, setClosed] = useState(false);
  const shownLogged = useRef(false);

  useEffect(() => {
    if (!cardCount) return; // the parent has not counted this card yet
    // Already on a home screen - settle it permanently rather than re-asking.
    if (isStandalone()) {
      markDone();
      return;
    }
    if (isDone()) return;
    setIOS(isIOS());
    setEligible(ASK_ON_CARDS.includes(cardCount));
  }, [cardCount]);

  // Whether the ask is possible is evaluated on render, not frozen on mount:
  // beforeinstallprompt can arrive a moment after this modal opens, and a
  // decision made too early would hide the button for exactly the browsers
  // that can act on it.
  const variant = installable ? "install" : ios ? "ios" : null;
  const visible = eligible && !closed && variant !== null;

  useEffect(() => {
    if (visible && !shownLogged.current) {
      shownLogged.current = true;
      trackEvent("keep_handy_shown", { surface: variant ?? undefined, date });
    }
  }, [visible, variant, date]);

  const done = useCallback(
    (surface: string) => {
      markDone();
      setClosed(true);
      trackEvent("keep_handy_confirmed", { surface, date });
    },
    [date],
  );

  const later = useCallback(
    (surface: string) => {
      // No flag written: the fifth card is the next ask, and that count is
      // already being kept. Nothing else needs remembering.
      setClosed(true);
      trackEvent("keep_handy_snoozed", { surface, date });
    },
    [date],
  );

  const install = useCallback(async () => {
    const outcome = await showInstallPrompt();
    // Chrome's own dialog is the source of truth - no self-reporting here.
    if (outcome === "accepted") done("install");
    else later("install");
  }, [done, later]);

  if (!visible) return null;

  return (
    <div className="wonky mt-2.5 flex items-center gap-3 border-2 border-dashed border-ink/35 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold leading-tight text-ink">
          Keep it on your home screen
        </span>
        {variant === "install" ? (
          <button
            onClick={install}
            className="mt-0.5 text-[11px] font-bold text-ink underline decoration-2 underline-offset-2"
          >
            Add WhoHadMore →
          </button>
        ) : (
          <>
            {/* No "below": the Share button is in the bottom bar only in
                Safari on iPhone. It is top-right on iPad, and top-right again
                in Chrome for iOS - so naming a location is wrong for a good
                share of the people reading this. The glyph is the instruction. */}
            <span className="block text-[11px] font-semibold leading-snug text-ink-secondary">
              Tap <ShareGlyph /> then &ldquo;Add to Home Screen&rdquo;
            </span>
            <button
              onClick={() => done("ios")}
              className="mt-0.5 text-[11px] font-bold text-ink underline decoration-2 underline-offset-2"
            >
              Done — don&apos;t ask again
            </button>
          </>
        )}
      </div>
      <button
        onClick={() => later(variant ?? "unknown")}
        aria-label="Not now"
        className="shrink-0 text-lg leading-none text-ink-secondary transition-colors hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
