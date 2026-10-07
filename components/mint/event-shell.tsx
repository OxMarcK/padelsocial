import { Logo } from "@/components/logo";
import { EVENT_NAV_SPACER_CLASS } from "@/lib/event-nav-spacer";

/**
 * Page frame for the tournament companion (/{slug}, standen, teams): the
 * Agenda's gradient and header treatment (white sticky bar, hairline shadow,
 * extrabold title), with a narrower content column since this is a phone-first
 * live view with the floating EventNav at the bottom.
 */
export function EventShell({
  title,
  width = "md",
  children,
}: {
  title?: string | null;
  width?: "md" | "sm";
  children: React.ReactNode;
}) {
  const maxW = width === "sm" ? "max-w-md" : "max-w-2xl";
  return (
    <div
      className={`min-h-screen font-mint text-mint-ink ${EVENT_NAV_SPACER_CLASS}`}
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-10 bg-white shadow-[0_1px_0_rgba(14,35,24,.10)]">
        <div className={`mx-auto flex ${maxW} items-center justify-between gap-3 px-6 py-3.5`}>
          <Logo variant="light" size="md" />
          {title ? <h1 className="min-w-0 truncate text-2xl font-extrabold tracking-tight text-mint-ink">{title}</h1> : null}
        </div>
      </header>
      <main className={`mx-auto flex ${maxW} flex-col gap-6 px-6 py-8`}>{children}</main>
    </div>
  );
}
