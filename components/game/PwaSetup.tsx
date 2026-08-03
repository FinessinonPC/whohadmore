"use client";

import { useEffect } from "react";
// Imported for its side effect: lib/installPrompt starts listening for
// beforeinstallprompt at module scope, which is the only way to catch it.
// The event fires once, early, and is gone if nothing calls preventDefault()
// on it - an effect in a component that mounts later would already be too late.
import "@/lib/installPrompt";

/**
 * The two pieces of PWA plumbing, in one place. Renders nothing.
 *
 * 1. Capturing the install prompt (via the import above), so KeepHandy can
 *    offer it at the end of a card rather than losing it on page load.
 * 2. Registering the service worker, without which Chrome never fires that
 *    prompt in the first place - it will not offer to install a site that
 *    cannot answer a navigation offline.
 */
export function PwaSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // dev has its own asset pipeline
    if (!("serviceWorker" in navigator)) return;

    // After load: registering costs a request, and first paint should not be
    // waiting on it.
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* an unregistered worker just means no install prompt - never fatal */
      });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
