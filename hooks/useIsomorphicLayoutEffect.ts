"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect in the browser, useEffect on the server (where it would warn
 * and can't run anyway).
 *
 * Worth the ceremony where the effect decides WHICH layout to show. A plain
 * useEffect runs after the browser has painted, so the wrong layout is briefly
 * on screen; a layout effect runs before the paint, so the correction is never
 * visible. That is the difference between "the page loaded" and "the page
 * loaded twice".
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
