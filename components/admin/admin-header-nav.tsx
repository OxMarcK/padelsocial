"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Events" },
  { href: "/admin/sessies", label: "Sessies" },
  { href: "/admin/leden", label: "Leden" },
  { href: "/admin/agenda", label: "Agenda-hero" },
] as const;

/** Top-level admin nav — client component only for the active-link highlight
 * (usePathname), same pattern as components/admin/admin-nav.tsx's event tabs. */
export function AdminHeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 font-mint text-sm font-bold transition ${
              active ? "bg-mint-lime text-mint-ink" : "text-mint-ink-muted hover:text-mint-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
