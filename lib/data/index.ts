import type { DataRepo } from "./repo";

/**
 * Mock repo unless Supabase env vars are set — see .env.local.example and
 * the plan doc for why. Swapping to real Supabase needs no other code
 * changes: every page and Server Action goes through this one export.
 */
function selectRepo(): DataRepo {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Lazy require: supabase-repo.ts imports "server-only" and next/headers,
    // which must never end up in a client bundle or load without env vars set.
    return (require("./supabase-repo") as typeof import("./supabase-repo")).supabaseRepo;
  }
  return (require("./mock-repo") as typeof import("./mock-repo")).mockRepo;
}

export const repo: DataRepo = selectRepo();
