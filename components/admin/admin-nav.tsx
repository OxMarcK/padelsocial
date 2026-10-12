"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Scores" },
  // "Teams & poules" doesn't fit next to three other tabs on a phone, so it's "Teams" there.
  { href: "/teams", label: "Teams & poules", short: "Teams" },
  { href: "/settings", label: "Instellingen" },
  { href: "/videos", label: "Video's" },
] as const;

/** Real page navigation between the event-admin routes — a client component only
 * because usePathname (for the active-tab highlight) needs to run in the browser; the
 * pages themselves stay Server Components. */
export function AdminNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/admin/e/${eventId}`;

  return (
    <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      {TABS.map((t) => {
        const href = `${base}${t.href}`;
        const active = pathname === href;
        return (
          <Link
            key={t.href}
            href={href}
            className={`flex-1 rounded-xl py-2 text-center font-mint text-sm font-bold ${
              active ? "bg-mint-lime text-[#0E2318]" : "text-mint-ink-muted"
            }`}
          >
            {"short" in t ? (
              <>
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </>
            ) : (
              t.label
            )}
          </Link>
        );
      })}
    </div>
  );
}
