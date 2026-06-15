"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/feedback";

/** Small speaker toggle that persists the mute preference. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [muted, setMutedState] = useState(false);

  // Read the stored preference after mount (avoids SSR mismatch).
  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute" : "Mute"}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface hover:text-ink ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
        {muted ? (
          <path d="m23 9-6 6M17 9l6 6" />
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  );
}
