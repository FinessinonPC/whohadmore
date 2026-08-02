/**
 * The one host this site is indexed under.
 *
 * Canonical tags, OG URLs, the sitemap and robots.txt all resolve through
 * getSiteUrl(), so this line moves every one of them together. If Vercel's
 * primary domain ever changes, this is the only edit that has to happen.
 */
const CANONICAL_ORIGIN = "https://www.whohadmore.com";

/** Both spellings of the live domain - either one collapses to the canonical. */
const LIVE_HOSTS = new Set(["whohadmore.com", "www.whohadmore.com"]);

/**
 * Canonical site URL for metadata, sitemap, robots, and OG links.
 *
 * Any spelling of the live domain normalizes to CANONICAL_ORIGIN. That matters
 * because NEXT_PUBLIC_SITE_URL is set per-environment in Vercel and used to win
 * outright: production was emitting apex URLs in the sitemap and in every
 * canonical tag while robots.txt advertised www, which is two different sites as
 * far as Google is concerned. Now the env var can only pick a host we don't own
 * - it can't pick the wrong spelling of one we do.
 *
 * Preview and local hosts pass through untouched, so a preview build never
 * claims to be production.
 */
export function getSiteUrl(): string {
  const explicit = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  if (process.env.VERCEL_ENV === "production") return CANONICAL_ORIGIN;

  const productionAlias = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionAlias) {
    const normalized = normalizeOrigin(`https://${productionAlias}`);
    if (normalized) return normalized;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Origin-only, trailing slash stripped, live domain folded to the canonical.
 * Returns null for anything unparseable so a fat-fingered env var falls through
 * to the next source rather than taking the whole site's canonical with it.
 */
function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (LIVE_HOSTS.has(url.hostname.toLowerCase())) return CANONICAL_ORIGIN;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}
