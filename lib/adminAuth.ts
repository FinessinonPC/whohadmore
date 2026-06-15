// ============================================================================
// Server-side admin gate. NOT production auth — just a shared password (env
// ADMIN_PASSWORD) sent in the `x-admin-password` header, enough to keep /admin
// private during the build. Swap for real auth later.
// ============================================================================

export const ADMIN_HEADER = "x-admin-password";

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** True if the request carries the correct admin password (or none is set). */
export function checkAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  // When unset, admin is left open for local development.
  if (!expected) return true;
  return req.headers.get(ADMIN_HEADER) === expected;
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return true;
  return password === expected;
}
