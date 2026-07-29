"use client";

import { useEffect, useState } from "react";
import { getRun, subscribeRun, type RunState } from "@/lib/runStore";

/**
 * The current run, reactive. Starts null on the server and on the first client
 * render so hydration matches, then fills in from sessionStorage - the ticket
 * fading in a frame late is much cheaper than a hydration mismatch.
 */
export function useRun(): RunState | null {
  const [run, setRun] = useState<RunState | null>(null);
  useEffect(() => {
    setRun(getRun());
    return subscribeRun(setRun);
  }, []);
  return run;
}
