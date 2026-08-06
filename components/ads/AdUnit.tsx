"use client";

import { useEffect, useRef } from "react";
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
  const enabled = hasSlot(slot);

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
