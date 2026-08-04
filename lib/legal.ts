/**
 * The handful of facts the legal pages need that cannot be read off the code.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  FILL THESE IN BEFORE THESE PAGES ARE MUCH USE.
 *  Everything else in /privacy and /terms is accurate to what the site
 *  actually does - these four are the ones only you can answer.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const LEGAL = {
  /** Who operates the site. A personal name is fine if there's no company. */
  operator: "WhoHadMore",

  /**
   * A real, monitored address. Data-protection law expects a contact route
   * for access and deletion requests, and an unreachable one is worse than
   * none - it is a promise the site visibly fails to keep.
   */
  contactEmail: "hello@whohadmore.com",

  /**
   * Where disputes are governed. Set to your own country/state - an invented
   * jurisdiction is worse than silence, because it reads as deliberate.
   * e.g. "the State of New York, United States"
   */
  jurisdiction: "the United States",

  /** Shown on both pages. Bump when the terms materially change. */
  lastUpdated: "4 August 2026",
} as const;
