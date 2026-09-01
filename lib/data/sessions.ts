import type { SessionsRepo } from "./sessions-repo";

/**
 * Mock repo unless Supabase env vars are set — mirrors lib/data/index.ts exactly,
 * kept as a separate module (not merged into it) so the sessions feature never
 * shares an import graph with the tournament repo selection.
 */
function selectRepo(): SessionsRepo {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (require("./sessions-supabase-repo") as typeof import("./sessions-supabase-repo")).sessionsSupabaseRepo;
  }
  return (require("./sessions-mock-repo") as typeof import("./sessions-mock-repo")).sessionsMockRepo;
}

export const sessionsRepo: SessionsRepo = selectRepo();
