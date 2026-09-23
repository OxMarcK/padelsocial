// One-off export: pulls only the `sessions` table (title/date/location/status —
// no member names/emails, which live in separate `members`/`reservations`
// tables and are deliberately left untouched) from the live Supabase project,
// into a local dev-only seed file (lib/data/dev-seed.local.json, gitignored).
//
// Plain REST fetch rather than @supabase/supabase-js: that package's realtime
// client requires a native WebSocket global, which this repo's Node 18.13
// doesn't have — and we don't need realtime for a one-off read anyway.
//
// Run with: node scripts/export-sessions-seed.mjs
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const envText = readFileSync(resolve(repoRoot, ".env.local"), "utf8");
const serviceKeyLine = envText.split("\n").find((l) => l.startsWith("SUPABASE_SERVICE_ROLE_KEY="));
const serviceKey = serviceKeyLine.slice("SUPABASE_SERVICE_ROLE_KEY=".length).trim();

// NEXT_PUBLIC_SUPABASE_URL is commented out in .env.local (that's why the app
// falls back to the mock repo) — the project ref is public info in the file's
// own comment, so the API URL is derivable rather than secret.
const url = "https://iuxdkdrskvxwrvfsmsvq.supabase.co";

const res = await fetch(`${url}/rest/v1/sessions?select=*`, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();

writeFileSync(
  resolve(repoRoot, "lib/data/dev-seed.local.json"),
  JSON.stringify({ exportedAt: new Date().toISOString(), sessions: data }, null, 2)
);

console.log(`sessions: ${data.length}`);
