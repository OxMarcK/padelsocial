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
 * Design 6A trial variant of components/event-nav.tsx, restyled for the
 * light "mint" palette per the canvas reference: a white floating pill
 * instead of the dark court-night one, with the active item as a solid
 * dark-ink filled circle (white icon) rather than a plain lime-colored icon
 * on transparent — everything else (scroll-shrink behavior, routes) unchanged.
 * `active` is optional: a page one level below these three (e.g. a single
 * team's detail page, reached from Teams) isn't itself any of the three tabs,
 * so it renders the nav with nothing lit up rather than falsely claiming Teams.
 */
export function EventNav({ slug, active }: { slug: string; active?: "event" | "standen" | "teams" }) {
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
        className={`pointer-events-auto flex items-center rounded-full bg-white shadow-[0_4px_16px_rgba(20,35,28,.16)] transition-all duration-200 ${
          compact ? "gap-1 px-2.5 py-2" : "gap-1.5 px-3 py-2.5"
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
                compact ? "h-10 w-10" : "h-12 w-12"
              } ${isActive ? "bg-mint-ink text-white" : "text-mint-ink-muted"}`}
            >
              <Icon className={`transition-all duration-200 ${compact ? "h-[18px] w-[18px]" : "h-5 w-5"}`} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
