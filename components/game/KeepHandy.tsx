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

/** Said yes once - never ask that player again. Asking twice is the annoying part. */
type Saved = { done?: true; snoozedAt?: number };

/** How long "not now" lasts. A daily game is seen daily; a fortnight is a nudge,
 *  a week starts to feel like nagging. */
const SNOOZE_DAYS = 14;

const read = (): Saved => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
};
const write = (v: Saved) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: it will ask again, which is the safe direction to fail */
  }
};

/**
 * "Come back tomorrow" only works if coming back is easy.
 *
 * Shown at the end of a completed card - the one moment a player has just been
 * given something and nothing is being asked of them yet. Three asks, depending
 * on what the browser actually supports:
 *
 *  - Chrome/Edge/Android: a real install prompt. One tap, icon on the home
 *    screen, and the browser tells us truthfully whether they accepted.
 *  - iOS: no install API exists at all, so the best available is pointing at
 *    the Share button.
 *  - Desktop otherwise: the bookmark shortcut. No browser has had an
 *    "add bookmark" API for over a decade, so a keystroke really is the whole
 *    of what can be offered.
 *
 * Only the install path can be measured for certain. The other two end in an
 * "I've done it" button, which means those numbers are self-reported - people
 * who bookmark without saying so are invisible, and the odd person will click
 * it without bookmarking. Treat the desktop figure as a floor, not a count.
 */
export function KeepHandy() {
  const installable = useSyncExternalStore(subscribeInstall, canInstall, () => false);

  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [ios, setIOS] = useState(false);
  const [mac, setMac] = useState(false);
  const shownLogged = useRef(false);

  useEffect(() => {
    // Already installed: settle it permanently rather than re-deciding daily.
    if (isStandalone()) {
      write({ done: true });
      setReady(true);
      return;
    }
    const saved = read();
    const snoozeOver =
      !saved.snoozedAt || Date.now() - saved.snoozedAt > SNOOZE_DAYS * 86_400_000;
    setIOS(isIOS());
    setMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent));
    setHidden(Boolean(saved.done) || !snoozeOver);
    setReady(true);
  }, []);

  // The denominator for the whole funnel. Logged when it actually appears, and
  // once per mount - not on every re-render as the install event resolves.
  const variant = installable ? "install" : ios ? "ios" : "desktop";
  useEffect(() => {
    if (ready && !hidden && !shownLogged.current) {
      shownLogged.current = true;
      trackEvent("keep_handy_shown", { surface: variant });
    }
  }, [ready, hidden, variant]);

  const confirm = useCallback(
    (surface: string) => {
      write({ done: true });
      setHidden(true);
      trackEvent("keep_handy_confirmed", { surface });
    },
    [],
  );

  const snooze = useCallback(
    (surface: string) => {
      write({ snoozedAt: Date.now() });
      setHidden(true);
      trackEvent("keep_handy_snoozed", { surface });
    },
    [],
  );

  const install = useCallback(async () => {
    const outcome = await showInstallPrompt();
    // Chrome's own dialog is the source of truth here - no self-reporting.
    if (outcome === "accepted") confirm("install");
    else snooze("install");
  }, [confirm, snooze]);

  if (!ready || hidden) return null;

  return (
    <div className="wonky mt-2.5 flex items-center gap-3 border-2 border-dashed border-ink/35 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        {installable ? (
          <>
            <span className="block text-[13px] font-bold leading-tight text-ink">
              A new card lands at midnight
            </span>
            <button
              onClick={install}
              className="mt-0.5 text-[11px] font-bold text-ink underline decoration-2 underline-offset-2"
            >
              Put it on your home screen →
            </button>
          </>
        ) : (
          <>
            <span className="block text-[13px] font-bold leading-tight text-ink">
              A new card lands at midnight
            </span>
            <span className="block text-[11px] font-semibold text-ink-secondary">
              {ios ? (
                <>
                  Share <span aria-hidden>↑</span> then &ldquo;Add to Home Screen&rdquo;
                </>
              ) : (
                <>
                  Bookmark it: <kbd className="font-bold text-ink">{mac ? "⌘" : "Ctrl"}</kbd>
                  {" + "}
                  <kbd className="font-bold text-ink">D</kbd>
                </>
              )}
            </span>
            <button
              onClick={() => confirm(ios ? "ios" : "desktop")}
              className="mt-0.5 text-[11px] font-bold text-ink underline decoration-2 underline-offset-2"
            >
              Done — don&apos;t ask again
            </button>
          </>
        )}
      </div>
      <button
        onClick={() => snooze(variant)}
        aria-label="Not now"
        className="shrink-0 text-lg leading-none text-ink-secondary transition-colors hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
