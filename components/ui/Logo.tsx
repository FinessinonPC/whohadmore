// Flat brand glyph - a green triangle stacked over a red one, no container.
// Reads as "higher/lower" at any size without looking like an app icon.

interface MarkProps {
  className?: string;
  /** pixel size of the square mark */
  size?: number;
}

export function BrandMark({ className = "", size }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="WhoHadMore"
    >
      <path d="M 10 16 L 24 50 L 36 26" fill="none" className="stroke-correct" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 28 26 L 40 50 L 54 16" fill="none" className="stroke-wrong" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Glyph + condensed uppercase wordmark used in page headers. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <BrandMark className="h-[18px] w-[18px]" />
      <span className="text-[17px] font-condensed font-bold uppercase tracking-wide text-ink mt-0.5">
        WHOHADMORE
      </span>
    </span>
  );
}
