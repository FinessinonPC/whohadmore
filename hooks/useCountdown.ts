"use client";

import { useEffect, useState } from "react";
import { msUntilNextGameMidnight } from "@/lib/date";

/** "9:12:04" until the next card drops, ticking once a second. Empty string
 *  until the first client tick, so the server and the browser agree on the
 *  initial markup. */
export function useCountdown(): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const ms = msUntilNextGameMidnight();
      const total = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      setLabel(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return label;
}
