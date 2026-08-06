/**
 * AdSense configuration.
 *
 * The publisher id is baked in as the default so the script ships without any
 * dashboard configuration. It is not a secret - it appears in the page source
 * of every site running AdSense.
 *
 * The env var still wins where it is set, including when set to an empty
 * string: `??` only falls through on null/undefined, so
 * NEXT_PUBLIC_ADSENSE_CLIENT="" switches every trace of AdSense off from the
 * Vercel dashboard without a deploy. That is the kill switch.
 */
const DEFAULT_CLIENT = "ca-pub-9229999543376066";

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? DEFAULT_CLIENT;

/**
 * Two placements, two slots, no defaults for either.
 *
 * Slot ids only exist once AdSense has approved the site.
 *
 *   NEXT_PUBLIC_ADSENSE_SLOT        the bottom ad
 *   NEXT_PUBLIC_ADSENSE_SLOT_SIDE   the side rail (wide desktop only)
 *
 * The bottom ad is one ad unit shown two ways, because it is one decision:
 * pinned to the bottom of the viewport on a phone, in the flow under the cards
 * on a desktop. Only ever one of the two is rendered, so the id is never used
 * twice on a page and reporting still answers "what did the bottom ad earn".
 *
 * They are independently dormant, so the bottom can run alone for as long as
 * it takes to find out whether a second ad is worth having.
 */
/** The "Bottom Ad" unit, set in Vercel. Deliberately NOT hard-coded, unlike
 *  the publisher id: a baked-in slot would render real ads on every preview
 *  deployment too, and clicks on a staging URL are exactly what AdSense counts
 *  as invalid traffic. Coming from the environment means it is a thing you
 *  turn on per environment. */
export const SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";

/** No default - this unit doesn't exist yet. Create it in AdSense when the
 *  bottom ad has run long enough to say whether a second one is worth it. */
export const SLOT_SIDE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE ?? "";

/**
 * Whether to load the AdSense script at all.
 *
 * Needs only the publisher id, because AdSense will not approve a site that
 * isn't already carrying the script, and the slot ids only exist after
 * approval. Requiring a slot here would deadlock: no script, so no approval,
 * so no slot, so no script.
 */
export const adsScriptEnabled = (): boolean => ADSENSE_CLIENT.startsWith("ca-pub-");

/** A given placement renders only once it has a slot of its own. */
export const hasSlot = (slot: string): boolean =>
  adsScriptEnabled() && slot.trim().length > 0;

/** Any ad at all - used by the privacy policy and ads.txt. */
export const adsEnabled = (): boolean => adsScriptEnabled();
