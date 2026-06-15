// Clean, hand-built brand mark — two bars (one taller, green) reading as a
// higher/lower comparison. No external assets; scales crisply at any size.

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
      <rect x="16" y="33" width="11" height="15" rx="4" fill="#FFFFFF" fillOpacity="0.85" />
      <rect x="30.5" y="25" width="11" height="23" rx="4" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x="45" y="16" width="11" height="32" rx="4" fill="#00C853" />
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
