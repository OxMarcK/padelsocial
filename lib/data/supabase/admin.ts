import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — server-only, bypasses RLS. Used by supabase-repo.ts
 * for every read and write; this app has no direct client-side Supabase
 * usage, so RLS in the migration is defense-in-depth, not the primary gate.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, or leave them unset to use the mock repo."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    // Next.js patches the global fetch to cache indefinitely by default on
    // routes with no dynamic APIs in use (e.g. the public /[slug] pages,
    // which read no cookies/headers). This app has no use for that — every
    // read here should reflect the current DB state, since the whole "live"
    // experience (poll-refreshed public pages, TV mode) depends on it.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
