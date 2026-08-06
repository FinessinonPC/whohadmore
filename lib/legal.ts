/**
 * The handful of facts the legal pages need that cannot be read off the code.
 * Everything else in /privacy and /terms is accurate to what the site actually
 * does; these are the ones only the operator can answer.
 */
export const LEGAL = {
  /**
   * No company - the site is run by one person, so it is named after itself.
   * Swap in a legal name if you would rather be identified personally; either
   * is fine for a sole operator, and a name is only strictly needed once
   * there is an entity to name.
   */
  operator: "WhoHadMore",

  /**
   * Real and monitored, which is the part that matters: data-protection law
   * expects a working route for access and deletion requests, and an address
   * that bounces is a promise the site visibly fails to keep.
   *
   * Worth knowing this is published in plain text on a page crawlers read, so
   * it will be scraped. An alias on the domain forwarding here would take the
   * spam instead, and can be changed later without touching the policy.
   */
  contactEmail: "wklaxton@gmail.com",

  /**
   * Governing law. Named at country level - most US contracts name a state,
   * since that is where the law that would actually apply lives, so narrowing
   * this to your own state later would make the clause more useful than it is
   * now. It is honest as written, just broad.
   */
  jurisdiction: "the United States",

  /** Shown on both pages. Bump when the terms materially change. */
  lastUpdated: "6 August 2026",
} as const;
