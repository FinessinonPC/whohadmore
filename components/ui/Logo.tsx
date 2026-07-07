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
      <polygon points="32,4 4,32 60,32" fill="#00C853" />
      <polygon points="8,40 56,40 32,62" fill="#FF3B30" />
    </svg>
  );
}

/** Glyph + lowercase wordmark used in page headers. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <BrandMark className="h-[18px] w-[18px]" />
      <span className="text-[15px] font-extrabold lowercase tracking-tight text-ink">
        whohadmore
      </span>
    </span>
  );
}
