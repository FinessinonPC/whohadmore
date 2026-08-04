"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsEnabled } from "@/lib/ads";

/** Routes that never carry an ad. Admin is a private tool, and the legal pages
 *  should not be selling anything while explaining what they collect. */
const NO_ADS = ["/admin", "/privacy", "/terms"];

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

/**
 * One ad, at the foot of the page.
 *
 * Non-personalized only. requestNonPersonalizedAds is set before the first
 * push, which is what keeps this out of consent-banner territory: Google
 * requires a certified CMP for *personalized* ads to EEA/UK visitors, and
 * asking a stranger to accept tracking before they can play a puzzle costs
 * more than the ad earns. It pays less. At this traffic the difference is
 * pennies, and the site stays something you can hand to anyone.
 *
 * Renders nothing at all until both env vars are set - see lib/ads.
 */
export function AdSlot() {
  const pathname = usePathname();
  const pushed = useRef<string | null>(null);
  const enabled = adsEnabled() && !NO_ADS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!enabled || pushed.current === pathname) return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      // Must be set before the push, and setting it twice is harmless.
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.push({});
      pushed.current = pathname ?? "";
    } catch {
      /* an ad that fails to load is never worth breaking a page over */
    }
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="adsbygoogle-init"
        async
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
      />
      {/* Sized to whatever container it sits in, so placement is a decision
          made where it's used rather than baked in here.

          min-height reserves the space before the ad arrives. Without it the
          page reflows when it loads, pushing the footer links out from under
          a thumb that was already reaching for them - which feels worse than
          the ad itself, and which Core Web Vitals counts against you. */}
      <aside aria-label="Advertisement" className="mt-8 w-full" style={{ minHeight: 110 }}>
        <p className="mb-1 text-center text-[9px] font-bold uppercase tracking-widest text-ink-secondary/60">
          Advertisement
        </p>
        <ins
          key={pathname}
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    </>
  );
}
