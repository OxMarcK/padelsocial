"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the current Server Component tree every `intervalMs` — the app's "realtime" (spec §2.3.C allows polling instead of a Supabase Realtime channel). */
export function LivePoll({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
