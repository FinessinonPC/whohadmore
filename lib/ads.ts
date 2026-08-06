/**
 * AdSense configuration, kept in env vars rather than the repo.
 *
 * Both are NEXT_PUBLIC_ because the ad tag needs them in the browser - they
 * are public identifiers, not secrets. Keeping them out of the code means the
 * ad can be switched on, moved, or switched back off from the Vercel dashboard
 * without a deploy, which is what you want the first time something renders
 * wrong on a phone.
 *
 * Everything ad-related is dormant until BOTH are set. No script is loaded, no
 * markup is rendered, and the site behaves exactly as it did before.
 *
 *   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
 *   NEXT_PUBLIC_ADSENSE_SLOT=1234567890
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";

/**
 * Two gates, because AdSense hands over the two ids at different times.
 *
 * You get the publisher id at signup, and the site has to be carrying the
 * script before Google will review it. The ad-unit id only exists after
 * approval. Requiring both to do anything would leave you unable to get
 * reviewed - the script would never load, so review would never pass, so you
 * would never get a slot id.
 *
 * So: the script (and ads.txt, and the CSP, and the advertising section of the
 * privacy policy) turn on with the publisher id alone. The visible ad unit
 * waits for a slot.
 *
 * A publisher id that isn't a publisher id is the likeliest configuration
 * mistake, so the prefix is checked rather than assumed.
 */
export const adsScriptEnabled = (): boolean => ADSENSE_CLIENT.startsWith("ca-pub-");

/** The rendered unit needs a slot as well - one only exists after approval. */
export const adsEnabled = (): boolean =>
  adsScriptEnabled() && ADSENSE_SLOT.trim().length > 0;
