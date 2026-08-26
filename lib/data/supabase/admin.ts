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
    // which read no cookies/headers) — that bit us once already (see git
    // history). A short, explicit revalidate window is the middle ground:
    // bounded staleness (a couple of seconds, well under the live-poll
    // interval) instead of either "forever" or "never", so near-simultaneous
    // page loads/polls can share one round trip instead of each hitting
    // Supabase fresh. Non-GET requests (every write in supabase-repo.ts)
    // aren't affected — Next only ever caches GET.
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 2 } }) },
  });
}
