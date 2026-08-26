/**
 * Shown instantly by Next's loading.tsx convention while a route segment's
 * Server Component is still fetching data — without this, navigation just
 * freezes until the fetch resolves, which feels chunky even when it only
 * takes a few hundred ms.
 */
export function PageSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-flood-white/10" />
        <div className="h-4 w-28 animate-pulse rounded bg-flood-white/5" />
      </div>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-flood-white/10" />
      <div className="h-28 w-full animate-pulse rounded-2xl bg-flood-white/5" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-flood-white/5" />
        <div className="h-28 animate-pulse rounded-2xl bg-flood-white/5" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-11 w-full animate-pulse rounded-lg bg-flood-white/5" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-flood-white/5" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-flood-white/5" />
      </div>
    </main>
  );
}
