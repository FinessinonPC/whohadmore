"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ADSENSE_CLIENT, adsScriptEnabled, hasSlot } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

/**
 * The AdSense loader. Mounted once per page; next/script dedupes by id, so
 * rendering it alongside every unit is harmless and means no page can show an
 * ad without the script that fills it.
 *
 * Loads on the publisher id alone, with no slot - during review Google needs
 * to see the script on the site before there is any ad unit to render.
 */
export function AdScript() {
  if (!adsScriptEnabled()) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}

/**
 * One ad unit. Renders nothing without a slot id of its own.
 *
 * Non-personalized only: requestNonPersonalizedAds is set before the first
 * push, which is what keeps the site out of consent-banner territory. Google
 * requires a certified CMP for personalized ads to EEA/UK visitors, and asking
 * a stranger to accept tracking before they can play a puzzle costs more than
 * the ad earns.
 */
/**
 * Never serve ads on a preview host.
 *
 * Vercel gives every branch a *.vercel.app URL, and if the slot env var is set
 * for all environments those previews would serve live ads. Traffic and clicks
 * from a staging URL are what AdSense calls invalid, and invalid traffic gets
 * accounts limited or closed rather than politely warned. The same hosts are
 * already noindexed in middleware for the same underlying reason: they are not
 * the real site.
 */
function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(".vercel.app");
}

export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  style,
  className,
}: {
  slot: string;
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const pushed = useRef(false);
  // Resolved on the client: the host is not known while rendering on the
  // server, so this starts false and the unit appears once it is confirmed
  // real. Erring towards not showing an ad is the safe direction.
  const [live, setLive] = useState(false);
  useEffect(() => setLive(!isPreviewHost()), []);
  const enabled = hasSlot(slot) && live;

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      /* an ad that fails to load is never worth breaking a page over */
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(responsive ? { "data-full-width-responsive": "true" } : {})}
    />
  );
}
