"use client";

import { useState } from "react";

/**
 * Account deletion, tucked at the bottom of the profile. Two deliberate steps:
 * expand, then type DELETE - the word, not a guessable click - before the
 * button goes live. Everything about the copy says permanent.
 */
export function DangerZone({
  username,
  onDelete,
}: {
  username: string;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = confirm.trim().toUpperCase() === "DELETE";

  return (
    <section className="mt-4 mb-2 card-ink rounded-2xl p-6">
      <h2 className="text-sm font-extrabold text-ink">Account</h2>
      {!open ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-snug text-ink-secondary">
            Signed in as <span className="font-bold text-ink">{username}</span>. Deleting your
            account removes your scores, streaks, and achievements everywhere.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-wrong transition-colors hover:border-wrong/40 hover:bg-wrong/5"
          >
            Delete account
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-wrong/30 bg-wrong/5 p-4">
          <p className="text-sm font-bold text-ink">This can&apos;t be undone.</p>
          <p className="mt-1 text-[11px] leading-snug text-ink-secondary">
            Your profile, every score, your streak, and your achievements will be permanently
            deleted - on every device. Your email is removed too, so you can sign up fresh later,
            but nothing comes back.
          </p>
          <label className="mt-3 block text-[11px] font-semibold text-ink-secondary">
            Type <span className="font-extrabold text-ink">DELETE</span> to confirm
            <input
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError(null);
              }}
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold tracking-wide text-ink outline-none focus:border-wrong/60"
            />
          </label>
          {error && <p className="mt-2 text-[11px] font-semibold text-wrong">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={!armed || busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                const r = await onDelete();
                // Success navigates away; only failures land back here.
                if (!r.ok) {
                  setError(r.error ?? "Couldn't delete your account - try again.");
                  setBusy(false);
                }
              }}
              className="rounded-xl bg-wrong px-4 py-2.5 text-xs font-extrabold text-white transition-opacity disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="rounded-xl px-3 py-2.5 text-xs font-bold text-ink-secondary hover:text-ink"
            >
              Keep my account
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
