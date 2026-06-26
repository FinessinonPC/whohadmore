// Clean, hand-built brand mark - a green triangle up over a red triangle down,
// the higher/lower motif. No external assets; scales crisply at any size.

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
      <rect width="64" height="64" rx="16" fill="#111111" />
      {/* higher = green triangle up, lower = red triangle down */}
      <polygon points="32,12 18,30 46,30" fill="#00C853" />
      <polygon points="18,34 46,34 32,52" fill="#FF3B30" />
    </svg>
  );
}

/** Icon + wordmark lockup used in page headers. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BrandMark className="h-5 w-5" />
      <span className="text-sm font-extrabold tracking-tight text-ink">WhoHadMore</span>
    </span>
  );
}
