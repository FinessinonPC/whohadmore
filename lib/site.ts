/** Canonical site URL for metadata, sitemap, robots, and OG links. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Production always canonicalizes to the live www host (matching robots.txt
  // and the sitemap host, and the domain Vercel actually serves) so Google
  // indexes www.whohadmore.com - never the apex (which only redirects here) or
  // the shifting *.vercel.app deploy URL, which would split ranking signals.
  if (process.env.VERCEL_ENV === "production") return "https://www.whohadmore.com";
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
