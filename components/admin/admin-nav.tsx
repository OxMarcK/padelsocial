"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Scores" },
  { href: "/teams", label: "Teams & poules" },
  { href: "/settings", label: "Instellingen" },
] as const;

/** Real page navigation between the three event-admin routes — a client component only
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
              active ? "bg-mint-lime text-mint-lime-ink" : "text-mint-ink-muted"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
