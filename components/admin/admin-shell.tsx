import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { AdminHeaderNav } from "./admin-header-nav";
import { signOutAdmin } from "@/app/admin/actions";

/**
 * Shared chrome for every logged-in admin page — header (logo + top-level nav)
 * and footer (logged-in email + sign out), around the same mint gradient
 * background every admin page already painted individually. Replaces each
 * page's own repeated gradient-div/main boilerplate and gives admin an actual
 * "home" anchor + the first working sign-out button (repo.signOut() existed
 * but nothing in the UI called it before this).
 */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(14,35,24,.10)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="shrink-0">
            <Logo variant="light" size="sm" />
          </Link>
          <AdminHeaderNav />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">{children}</main>

      <footer className="border-t border-mint-net/15">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5 text-xs text-mint-ink-muted">
          <span>{email}</span>
          <form action={signOutAdmin}>
            <button type="submit" className="font-mint text-xs font-bold uppercase tracking-wider hover:text-mint-ink">
              Uitloggen
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
