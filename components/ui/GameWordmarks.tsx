// ============================================================================
// Per-game WORDMARKS - the game's name IS its logo, with one letter that plays
// the game's own trick. Handwritten edition: set in the marker pen, with the
// trick glyphs DRAWN, not constructed - wobbly paths, uneven corners, a slight
// lean, like someone doodled them on the scorecard.
//
// Every wordmark inherits `color` from its parent; pass `alt` for the accent
// used by the trick letter where one is needed.
// ============================================================================

import type { ModeId } from "@/lib/modes";

interface WordmarkProps {
  /** Tailwind text size utilities, e.g. "text-5xl" */
  className?: string;
  /** Color for the trick letter / second voice, where the mark uses one. */
  alt?: string;
}

const base = "inline-flex items-baseline font-condensed uppercase leading-none";

/** CHAIN - the A is a hand-sketched peak. */
export function ChainWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Chain">
      <span>CH</span>
      <svg viewBox="0 0 56 56" className="mx-[0.04em] h-[0.78em] w-auto self-center" aria-hidden>
        <path
          d="M 29 5 C 22 17 12 38 6 51 C 20 47 38 47 51 50 C 44 35 35 16 29 5 Z"
          fill={alt ?? "currentColor"}
          stroke="#16181D"
          strokeWidth="4.5"
          strokeLinejoin="round"
          transform="rotate(-4 28 28)"
        />
      </svg>
      <span>IN</span>
    </span>
  );
}

/** DUALITY - two voices, with a quick underline scrawled beneath the second. */
export function DualityWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Duality">
      <span>DUAL</span>
      <span className="relative inline-flex flex-col items-center">
        <span style={{ color: alt ?? "currentColor", opacity: alt ? 1 : 0.5 }}>ITY</span>
        <svg
          viewBox="0 0 60 10"
          className="absolute -bottom-[0.16em] left-0 h-[0.16em] w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 2 6 C 12 2 20 8 30 5 C 40 2 50 7 58 4"
            fill="none"
            stroke={alt ?? "currentColor"}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}

/** WORD - the O is scribbled in, the way you circle an answer. */
export function WordWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Word">
      <span>W</span>
      <svg viewBox="0 0 56 56" className="mx-[0.03em] h-[0.7em] w-auto self-center" aria-hidden>
        <path
          d="M 30 6 C 14 8 4 18 6 31 C 8 45 22 52 34 49 C 47 46 53 33 49 21 C 45 10 33 4 24 9"
          fill="none"
          stroke={alt ?? "currentColor"}
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(6 28 28)"
        />
        <path
          d="M 27 12 C 17 15 12 24 14 32 C 17 42 27 46 35 43"
          fill="none"
          stroke={alt ?? "currentColor"}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
      <span>RD</span>
    </span>
  );
}

/** MINI - the last I is two crossword cells, penned quickly. */
export function MiniWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Mini">
      <span>MIN</span>
      <svg viewBox="0 0 26 56" className="ml-[0.09em] h-[0.74em] w-auto self-center" aria-hidden>
        <path
          d="M 4 4 C 11 3 18 3.5 22 4 C 22.5 10 22 18 21.5 24 C 15 25 9 24.5 4.5 24 C 3.5 18 3.5 10 4 4 Z"
          fill="none"
          stroke="#16181D"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M 4.5 31 C 11 30 17 30.5 21.5 31 C 22 37 22 45 21.5 51.5 C 15 52.5 9 52 4 51.5 C 3.5 45 4 37 4.5 31 Z"
          fill={alt ?? "currentColor"}
          stroke="#16181D"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const MARKS: Record<ModeId, (p: WordmarkProps) => React.ReactNode> = {
  chain: ChainWordmark,
  duality: DualityWordmark,
  word: WordWordmark,
  mini: MiniWordmark,
};

export function GameWordmark({
  mode,
  className,
  alt,
}: WordmarkProps & { mode: ModeId }) {
  const Mark = MARKS[mode];
  return <Mark className={className} alt={alt} />;
}
