"use client";

import { Sheet } from "@/components/ui/Sheet";

// ============================================================================
// STUB - not wired up yet.
//
// Lands with auth. Reads from the `leaderboard_entries` table (already in the
// schema) and renders the ranked board for a given play_date. The future
// /leaderboard/[date] page will reuse this sheet.
// ============================================================================

interface LeaderboardSheetProps {
  open: boolean;
  onClose: () => void;
  playDate: string;
}

export function LeaderboardSheet({ open, onClose }: LeaderboardSheetProps) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="py-10 text-center">
        <h2 className="text-xl font-extrabold text-ink">Leaderboard</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Coming soon - sign in to compete on the daily board.
        </p>
      </div>
    </Sheet>
  );
}
