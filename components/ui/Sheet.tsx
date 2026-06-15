"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

interface SheetProps {
  open: boolean;
  onClose?: () => void;
  /** When false, tapping the backdrop / pressing Esc won't close it. */
  dismissable?: boolean;
  children: React.ReactNode;
  /** Max width of the sheet panel. Defaults to the game width. */
  maxWidthClass?: string;
}

/**
 * Bottom-sheet primitive. Slides up from the bottom edge with a spring, fades
 * a scrim behind it. Used for the end screen, image picker, AI drawer, etc.
 */
export function Sheet({
  open,
  onClose,
  dismissable = true,
  children,
  maxWidthClass = "max-w-game",
}: SheetProps) {
  // Lock body scroll + wire up Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissable, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => dismissable && onClose?.()}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${maxWidthClass} max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-background p-6 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:rounded-3xl`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {dismissable && (
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
