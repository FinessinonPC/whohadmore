// ============================================================================
// Server-side admin gate. NOT production auth - just a shared password (env
// ADMIN_PASSWORD) sent in the `x-admin-password` header, enough to keep /admin
// private during the build. Swap for real auth later.
//
// Security default: if ADMIN_PASSWORD is NOT set, admin is LOCKED (access is
// denied), never open. You must configure a password to use the admin panel.
// ============================================================================

export const ADMIN_HEADER = "x-admin-password";

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** True only if a password is configured AND the request presents the right one. */
export function checkAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // not configured -> locked
  return req.headers.get(ADMIN_HEADER) === expected;
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // not configured -> locked
  return password === expected;
}
