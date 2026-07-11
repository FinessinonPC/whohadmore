"use client";

import { useState } from "react";
import { getStoredAdminPassword } from "@/lib/adminClient";

export function BackfillButton() {
  const password = getStoredAdminPassword();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleBackfill = async () => {
    if (!password) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backfill-scores", {
        method: "POST",
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Success! Updated ${data.updatedCount} out of ${data.totalProfiles} profiles.`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setResult(`Failed: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="mt-8 rounded-xl border border-border p-6 bg-surface">
      <h2 className="text-lg font-bold text-ink">Backfill Scores</h2>
      <p className="mt-1 text-sm text-ink-secondary mb-4">
        Recalculates all all-time scores from scratch to ensure quick games are included for all profiles.
      </p>
      <button
        onClick={handleBackfill}
        disabled={loading}
        className="rounded bg-ink px-4 py-2 text-sm font-semibold text-surface disabled:opacity-50"
      >
        {loading ? "Backfilling..." : "Run Backfill"}
      </button>
      {result && <p className="mt-3 text-sm font-medium text-correct">{result}</p>}
    </div>
  );
}
