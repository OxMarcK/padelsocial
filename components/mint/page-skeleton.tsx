/**
 * Design 6A trial variant of components/page-skeleton.tsx, restyled for the
 * light "mint" palette — same loading.tsx role (shown instantly while a
 * route segment's Server Component is still fetching), just matching the
 * mint pages' white header + gradient body instead of the dark theme, so
 * navigating between them doesn't flash a dark skeleton in between.
 */
export function PageSkeleton() {
  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <div className="bg-white px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-mint-net/15" />
          <div className="h-6 w-24 animate-pulse rounded bg-mint-net/15" />
        </div>
      </div>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-white/70" />
        <div className="h-28 w-full animate-pulse rounded-[28px] bg-white/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-[28px] bg-white/70" />
          <div className="h-28 animate-pulse rounded-[28px] bg-white/70" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-11 w-full animate-pulse rounded-2xl bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-2xl bg-white/70" />
          <div className="h-11 w-full animate-pulse rounded-2xl bg-white/70" />
        </div>
      </main>
    </div>
  );
}
