import { Logo } from "@/components/logo";

/** Shared dark footer for the Agenda landing page and the session signup
 * page — same content, same responsive behavior: a row (logo+tagline left,
 * copyright right) at sm+ widths, centered and stacked on mobile, matching
 * the homepage's own mobile footer layout. */
export function SiteFooter() {
  return (
    <footer className="mt-14 bg-[#0E2318] py-10 sm:mt-[88px]">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-7 px-6 text-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5 sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Logo variant="dark" size={46} />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">Play &middot; Connect &middot; Elevate</span>
        </div>
        <span className="text-xs font-medium text-white/60">© 2026 Padel Social</span>
      </div>
    </footer>
  );
}
