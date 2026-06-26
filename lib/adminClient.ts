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
