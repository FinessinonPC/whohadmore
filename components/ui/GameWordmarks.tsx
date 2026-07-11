// ============================================================================
// Per-game WORDMARKS - the game's name IS its logo, with one letter that plays
// the game's own trick. Handwritten edition: the trick glyphs are DOODLED, not
// constructed. Every glyph is built from open pen strokes that overshoot their
// corners, plus a lighter second pass slightly off the first - the way a real
// hand goes over a line twice. Nothing closes cleanly, nothing is symmetric.
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

/** CHAIN - the A is a peak scribbled in two pen strokes over a color blob. */
export function ChainWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Chain">
      <span>CH</span>
      <svg viewBox="0 0 56 56" className="mx-[0.04em] h-[0.78em] w-auto self-center" aria-hidden>
        <g transform="rotate(-5 28 28)">
          {/* the color is filled in first, loosely, like a marker blob */}
          <path
            d="M 30 9 C 24 18 16 35 10 49 C 22 45.5 37 46 48 48.5 C 42.5 34.5 35 19 30 9 Z"
            fill={alt ?? "currentColor"}
            opacity="0.92"
          />
          {/* pass 1: down the left side and along the base, overshooting both ends */}
          <path
            d="M 33 3.5 C 25.5 14 15.5 34 6.5 52.5 C 20.5 47.5 37.5 47.5 52.5 50.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* pass 2: the right side, a lighter quicker line */}
          <path
            d="M 29.5 7 C 35.5 17.5 43 34 50.5 51.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.65"
          />
        </g>
      </svg>
      <span>IN</span>
    </span>
  );
}

/** DUALITY - two voices, the second underlined with a double scrawl. */
export function DualityWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Duality">
      <span>DUAL</span>
      <span className="relative inline-flex flex-col items-center">
        <span style={{ color: alt ?? "currentColor", opacity: alt ? 1 : 0.5 }}>ITY</span>
        <svg
          viewBox="0 0 60 12"
          className="absolute -bottom-[0.18em] left-0 h-[0.19em] w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 1.5 7 C 10 2.5 19 9.5 29 6 C 39 2.5 49 9 58.5 4"
            fill="none"
            stroke={alt ?? "currentColor"}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 4 9.5 C 16 6.5 30 10 45.5 6.5"
            fill="none"
            stroke={alt ?? "currentColor"}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </span>
    </span>
  );
}

/** WORD - the O is circled the way you circle an answer: twice, carelessly. */
export function WordWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Word">
      <span>W</span>
      <svg viewBox="0 0 56 56" className="mx-[0.03em] h-[0.7em] w-auto self-center" aria-hidden>
        {/* pass 1: the big loop - the ends cross instead of closing */}
        <path
          d="M 36 7 C 18 2.5 4.5 15.5 6.5 30.5 C 8.5 45.5 23.5 54.5 37 49 C 50.5 43.5 54.5 27.5 46 16.5 C 38.5 7 25 5.5 19.5 14.5"
          fill="none"
          stroke={alt ?? "currentColor"}
          strokeWidth="6.5"
          strokeLinecap="round"
          transform="rotate(7 28 28)"
        />
        {/* pass 2: a quicker inner circle at a different angle */}
        <path
          d="M 27.5 11.5 C 15.5 14 10 24.5 13.5 34 C 17 44 29 48 37.5 43 C 45.5 38.5 47.5 27 42 20"
          fill="none"
          stroke={alt ?? "currentColor"}
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.55"
          transform="rotate(-6 28 28)"
        />
      </svg>
      <span>RD</span>
    </span>
  );
}

/** MINI - the last I is two crossword cells; the top one never quite closes. */
export function MiniWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Mini">
      <span>MIN</span>
      <svg viewBox="0 0 26 56" className="ml-[0.09em] h-[0.74em] w-auto self-center" aria-hidden>
        {/* top cell: one wobbly stroke, pen lifted before it meets the start */}
        <path
          d="M 5.5 4.5 C 11 3 18 4.5 23 3.5 C 22 10.5 23.5 17.5 22 25 C 15.5 24 8.5 26 3.5 24.5 C 4.5 18 2.8 11.5 3.6 6.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* bottom cell: colored in, outlined off-square and leaning */}
        <path
          d="M 4 32 C 10.5 30.5 17.5 32 22.5 31 C 21.5 38 23 45.5 21.5 52 C 15 53 8.5 51.5 3.5 52 C 4.5 45 3 38.5 4 32 Z"
          fill={alt ?? "currentColor"}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
          transform="rotate(-3 13 42)"
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
