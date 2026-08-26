"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 20V12" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14c2.4.3 4.3 2.3 4.5 5.5" />
    </svg>
  );
}

const ITEMS = [
  { key: "event", label: "Event", Icon: HomeIcon },
  { key: "standen", label: "Standen", Icon: ChartIcon },
  { key: "teams", label: "Teams", Icon: UsersIcon },
] as const;

/**
 * Floating icon-only bottom bar (Instagram-style), shared across the event,
 * standen and teams pages. Shrinks a touch once you scroll past the top so
 * it stays out of the way of the content. No TV-modus link — that's a
 * spectator display, not meant for people to tap into themselves.
 */
export function EventNav({ slug, active }: { slug: string; active: "event" | "standen" | "teams" }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav
        className={`pointer-events-auto flex items-center rounded-full border border-flood-white/10 bg-court-night/90 shadow-lg backdrop-blur-md transition-all duration-200 ${
          compact ? "gap-0.5 px-2 py-1.5" : "gap-1.5 px-3 py-2.5"
        }`}
      >
        {ITEMS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={key === "event" ? `/${slug}` : `/${slug}/${key}`}
              aria-label={label}
              className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                compact ? "h-9 w-9" : "h-12 w-12"
              } ${isActive ? "text-lime-serve" : "text-ink-muted"}`}
            >
              <Icon className={`transition-all duration-200 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
