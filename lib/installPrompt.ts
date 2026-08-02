/**
 * Capture Chrome's install prompt before it goes to waste.
 *
 * There is no API for "bookmark this page" - every browser removed it years
 * ago, so the only honest desktop answer is to tell someone the shortcut. The
 * install prompt is the exception: on Chrome and Edge, `beforeinstallprompt`
 * hands over a real prompt we can fire later, which is the difference between
 * asking a player to remember a URL and putting an icon on their home screen.
 *
 * The event fires once, early, and is lost unless preventDefault() is called on
 * it - which is why this listener attaches at module scope rather than in an
 * effect. It is imported by <InstallCapture/> in the root layout so it runs as
 * soon as the client bundle evaluates, well before any results modal exists to
 * ask for it.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Suppress Chrome's own mini-infobar; we ask at a better moment than
    // "the second you arrived", which is when it would have fired.
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

/** Whether a real install prompt is available to fire right now. */
export const canInstall = () => deferred !== null;

export function subscribeInstall(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Fire the captured prompt. It is single-use, so it is dropped either way. */
export async function showInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}

/** Already installed - never ask again. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari predates the display-mode media query for home-screen apps.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iOS has no install API at all - the only route is Share > Add to Home Screen. */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, distinguishable only by touch support.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
