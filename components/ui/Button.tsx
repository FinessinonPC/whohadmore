"use client";

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Scorecard buttons: printed, not painted - heavy ink line + solid ink shadow
// that the press physically flattens (translate onto the shadow).
const base =
  "inline-flex items-center justify-center font-bold wonky transition-all duration-100 " +
  "active:translate-x-[3px] active:translate-y-[3px] active:shadow-none " +
  "disabled:opacity-40 disabled:pointer-events-none select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-cta text-background border-[3px] border-ink ink-shadow-sm hover:opacity-95",
  secondary: "bg-surface text-ink border-[3px] border-ink ink-shadow-sm hover:bg-border/30",
  ghost: "bg-transparent text-ink-secondary hover:text-ink hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className = "", ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
