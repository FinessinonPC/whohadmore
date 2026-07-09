import { ADMIN_HEADER } from "@/lib/adminAuth";

// Client-side admin session helpers. The password lives in sessionStorage and
// rides along on every admin API call. (Not real auth - build-time gate only.)

const ADMIN_PW_KEY = "whohadmore_admin_pw";

export function getStoredAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ADMIN_PW_KEY);
}

export function storeAdminPassword(pw: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_PW_KEY, pw);
}

export function clearAdminPassword(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_PW_KEY);
}

// --- Admin preview bypass ----------------------------------------------------
// The archive sign-in wall is a growth nudge for players, but the admin needs to
// preview past/future days freely. We mark this browser (localStorage, shared
// across tabs) from the authed admin panel; the game shell then bypasses the
// gate only when BOTH that mark and an explicit ?preview=1 are present - so a
// public visitor can't stumble past the wall.
const ADMIN_PREVIEW_KEY = "whohadmore_admin_preview";

/** Called from the admin panel right before opening a preview link. */
export function enableAdminPreview(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_PREVIEW_KEY, "1");
    document.cookie = `${ADMIN_PREVIEW_KEY}=1; path=/; max-age=86400`;
  } catch {
    /* non-fatal */
  }
}

/** True when the current page is an admin preview (bypass the archive gate). */
export function isAdminPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("preview") === "1" &&
      window.localStorage.getItem(ADMIN_PREVIEW_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/** fetch() wrapper that attaches the admin password header + JSON content type. */
export async function adminFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const pw = getStoredAdminPassword();
  if (pw) headers.set(ADMIN_HEADER, pw);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}
