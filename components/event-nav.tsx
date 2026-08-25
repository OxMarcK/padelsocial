import Link from "next/link";

const ITEMS = [
  { key: "event", label: "Event" },
  { key: "standen", label: "Standen" },
  { key: "teams", label: "Teams" },
  { key: "tv", label: "TV-modus" },
] as const;

/**
 * Fixed bottom tab bar, shared across the event, standen and teams pages so
 * you can always get between them. TV mode is a fixed spectator display and
 * doesn't render this itself. Pages using this need bottom padding (see
 * EVENT_NAV_SPACER_CLASS) so the fixed bar never covers page content.
 */
export function EventNav({ slug, active }: { slug: string; active: "event" | "standen" | "teams" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-flood-white/10 bg-court-night/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "event" ? `/${slug}` : `/${slug}/${item.key}`}
            className={`flex-1 py-3 text-center font-display text-xs font-bold uppercase tracking-wide ${
              active === item.key ? "text-lime-serve" : "text-ink-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

/** Add to the bottom of any <main> that renders EventNav, so content can scroll clear of the fixed bar. */
export const EVENT_NAV_SPACER_CLASS = "pb-20";
