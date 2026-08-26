"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current Server Component tree every `intervalMs` — the
 * app's "realtime" (spec §2.3.C allows polling instead of a Supabase
 * Realtime channel). 20s by default: scores only change when an admin
 * finishes entering one, not continuously, so there's nothing to gain from
 * polling much faster than that — it would only add load for no visible benefit.
 */
export function LivePoll({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
