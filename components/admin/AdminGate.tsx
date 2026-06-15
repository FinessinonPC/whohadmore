"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getStoredAdminPassword,
  storeAdminPassword,
} from "@/lib/adminClient";

type Status = "checking" | "locked" | "unlocked";

/** Wraps admin pages with a sessionStorage password gate (build-time only). */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function verify(pw: string): Promise<boolean> {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    const data = (await res.json()) as { ok: boolean };
    return data.ok;
  }

  // On mount, try the stored password (or empty, which passes when unconfigured).
  useEffect(() => {
    (async () => {
      const stored = getStoredAdminPassword() ?? "";
      const ok = await verify(stored).catch(() => false);
      setStatus(ok ? "unlocked" : "locked");
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const ok = await verify(password).catch(() => false);
    setSubmitting(false);
    if (ok) {
      storeAdminPassword(password);
      setStatus("unlocked");
    } else {
      setError("Incorrect password");
    }
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6">
        <h1 className="text-xl font-extrabold text-ink">Admin</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Enter the admin password to continue.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex w-full flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-ink"
          />
          {error && <p className="text-xs font-semibold text-wrong">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
