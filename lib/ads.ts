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
 * One slot per placement, and no defaults for any of them.
 *
 * Slot ids only exist once AdSense has approved the site, and each placement
 * gets its own ad unit rather than sharing one - not for correctness, since
 * sharing works, but because reporting is per-unit. Sharing an id would leave
 * you unable to tell whether it is the sticky banner or the side rail earning
 * anything, which is exactly the question worth asking a month in.
 *
 * Each is independently dormant, so they can be switched on one at a time.
 *
 *   NEXT_PUBLIC_ADSENSE_SLOT          in-flow, under the cards (desktop)
 *   NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR   sticky bottom banner (mobile)
 *   NEXT_PUBLIC_ADSENSE_SLOT_SIDE     side rail (wide desktop)
 */
export const SLOT_INFLOW = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";
export const SLOT_ANCHOR = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR ?? "";
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
