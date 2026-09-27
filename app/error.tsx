"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Next.js falls back to its bare "Application error" digest page whenever a
 * server-side exception happens and no error.tsx exists — this replaces that
 * with the same branded shell as not-found.tsx, so a crash still looks like
 * the app instead of a raw stack-trace page.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <Logo variant="light" size="lg" />
      <div>
        <div className="text-2xl font-bold">Even een misser…</div>
        <p className="mt-1 text-sm text-mint-ink-muted">Kan gebeuren., geen stress</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-[#0E2318] px-5 py-2.5 font-mint text-sm font-bold text-white hover:bg-[#193626]"
        >
          Probeer opnieuw
        </button>
        <Link href="/" className="font-mint text-sm font-bold text-mint-lime-ink underline underline-offset-2">
          Terug naar homepage
        </Link>
      </div>
    </div>
  );
}
