/** Canonical site URL for metadata, sitemap, robots, and OG links. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Production always canonicalizes to the apex domain (matching robots.txt and
  // the sitemap host) so Google indexes whohadmore.com - never the shifting
  // *.vercel.app deploy URL, which would split ranking signals off the brand.
  if (process.env.VERCEL_ENV === "production") return "https://whohadmore.com";
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
