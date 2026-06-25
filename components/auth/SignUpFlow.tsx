"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getBrowserSupabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/playStore";

type Step = "email" | "code" | "username";

/**
 * Passwordless sign-up / login. Enter email → receive a 6-digit code → verify →
 * (new players) pick a unique username. On success, onDone() should reload the
 * profile. Requires Supabase email OTP to be enabled and the email template to
 * include the {{ .Token }} code.
 */
export function SignUpFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await getBrowserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verify() {
    setBusy(true);
    setError(null);
    const { data, error } = await getBrowserSupabase().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error || !data.session) {
      setBusy(false);
      setError(error?.message ?? "That code didn't work.");
      return;
    }
    const accessToken = data.session.access_token;
    setToken(accessToken);
    // Existing account → logged in; otherwise we need a username.
    const res = await fetch("/api/profile/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, session_id: getSessionId() }),
    });
    const d = (await res.json()) as { profile?: unknown; needsUsername?: boolean; error?: string };
    setBusy(false);
    if (d.profile) {
      onDone();
      return;
    }
    if (d.needsUsername) {
      setStep("username");
      return;
    }
    setError(d.error ?? "Something went wrong.");
  }

  async function claimUsername() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        session_id: getSessionId(),
        username: username.trim(),
      }),
    });
    const d = (await res.json()) as { profile?: unknown; error?: string };
    setBusy(false);
    if (d.profile) {
      onDone();
      return;
    }
    setError(d.error ?? "Couldn't save that.");
  }

  return (
    <div className="text-center">
      {step === "email" && (
        <>
          <p className="text-xl font-extrabold text-ink">Sign up or log in</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-secondary">
            Enter your email and we&apos;ll send a verification code — no password.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email.trim() && sendCode()}
              placeholder="you@email.com"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-center text-base font-semibold outline-none focus:border-ink"
            />
            <Button size="lg" onClick={sendCode} disabled={busy || !email.includes("@")} className="w-full">
              {busy ? "Sending…" : "Send code"}
            </Button>
          </div>
        </>
      )}

      {step === "code" && (
        <>
          <p className="text-xl font-extrabold text-ink">Check your email</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-secondary">
            We sent a code to <span className="font-semibold text-ink">{email}</span>. Enter it below.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.trim() && verify()}
              placeholder="123456"
              maxLength={6}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-ink"
            />
            <Button size="lg" onClick={verify} disabled={busy || code.trim().length < 6} className="w-full">
              {busy ? "Verifying…" : "Verify"}
            </Button>
            <button
              onClick={() => setStep("email")}
              className="text-xs font-semibold text-ink-secondary underline underline-offset-2 hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        </>
      )}

      {step === "username" && (
        <>
          <p className="text-xl font-extrabold text-ink">Pick a username</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-secondary">
            This is how you&apos;ll appear on the leaderboard. It must be unique.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && username.trim() && claimUsername()}
              placeholder="Choose a username"
              maxLength={20}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-center text-base font-semibold outline-none focus:border-ink"
            />
            <Button size="lg" onClick={claimUsername} disabled={busy || !username.trim()} className="w-full">
              {busy ? "Saving…" : "Claim username"}
            </Button>
          </div>
        </>
      )}

      {error && <p className="mt-2 text-sm font-semibold text-wrong">{error}</p>}
    </div>
  );
}
