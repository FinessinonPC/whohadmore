import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";

export const dynamic = "force-dynamic";

/**
 * /ads.txt - the IAB file naming who is authorised to sell this site's
 * inventory. Google checks for it, and without a matching line some buyers
 * will not bid at all, so an absent ads.txt quietly costs revenue rather than
 * breaking anything visibly.
 *
 * Generated from the same env var as the ad tag, so the publisher id cannot
 * drift between the two - which is the usual way this file ends up wrong.
 * 404s while ads are unconfigured, because an ads.txt authorising nobody is
 * worse than none at all.
 */
export function GET() {
  if (!adsEnabled()) {
    return new Response("Not found", { status: 404 });
  }
  // "pub-..." here, not "ca-pub-..." - the ads.txt format wants the bare id.
  const publisher = ADSENSE_CLIENT.replace(/^ca-/, "");
  const body = `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
