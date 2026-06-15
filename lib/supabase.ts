import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Supabase clients
//   - browser():  anon client for client components (singleton)
//   - server():   anon client for RSC / route handlers (reads public data)
//   - service():  SERVICE-ROLE client, server-only. Bypasses RLS — use only in
//                 trusted server routes (admin writes). Never import in a
//                 "use client" module.
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

// --- Browser (anon) — single instance reused across the app -----------------
let browserClient: SupabaseClient | undefined;

export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      requireEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );
  }
  return browserClient;
}

// --- Server (anon) — for reading public, published data ---------------------
export function getServerSupabase(): SupabaseClient {
  return createClient(
    requireEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  );
}

// --- Server (service role) — trusted writes only ----------------------------
export function getServiceSupabase(): SupabaseClient {
  return createClient(
    requireEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
