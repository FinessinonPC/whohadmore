// ============================================================================
// Per-game WORDMARKS - the game's name IS its logo, with one custom letter
// that plays the game's own trick. Set in the condensed display face. This is
// how real daily games brand themselves (a letter that behaves), not icons in
// tinted squares.
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

const base =
  "inline-flex items-baseline font-condensed font-semibold uppercase leading-none tracking-wide";

/** CHAIN - the A is the up-triangle. */
export function ChainWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Chain">
      <span>CH</span>
      <svg viewBox="0 0 56 56" className="mx-[0.02em] h-[0.74em] w-auto self-center" aria-hidden>
        <polygon points="28,2 2,54 54,54" fill={alt ?? "currentColor"} />
      </svg>
      <span>IN</span>
    </span>
  );
}

/** DUALITY - the word itself is split between two voices. */
export function DualityWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Duality">
      <span>DUAL</span>
      <span style={{ color: alt ?? "currentColor", opacity: alt ? 1 : 0.45 }}>ITY</span>
    </span>
  );
}

/** WORD - the O is a letter tile. */
export function WordWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Word">
      <span>W</span>
      <svg viewBox="0 0 56 56" className="mx-[0.05em] h-[0.72em] w-auto self-center" aria-hidden>
        <rect x="3" y="3" width="50" height="50" rx="10" fill={alt ?? "currentColor"} />
        <circle cx="28" cy="28" r="11" fill="none" stroke={alt ? "currentColor" : "#0B0D10"} strokeWidth="7" />
      </svg>
      <span>RD</span>
    </span>
  );
}

/** MINI - the last I is a crossword column, black square included. */
export function MiniWordmark({ className = "", alt }: WordmarkProps) {
  return (
    <span className={`${base} ${className}`} aria-label="Mini">
      <span>MIN</span>
      <svg viewBox="0 0 26 56" className="ml-[0.08em] h-[0.72em] w-auto self-center" aria-hidden>
        <rect x="2" y="2" width="22" height="24" rx="5" fill="none" stroke={alt ?? "currentColor"} strokeWidth="5" />
        <rect x="2" y="31" width="22" height="23" rx="5" fill={alt ?? "currentColor"} />
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
