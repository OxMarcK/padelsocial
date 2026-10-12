/**
 * Admin always reads straight from the database. The Supabase client caches GETs for
 * 2 seconds (lib/data/supabase/admin.ts) so the public pages and their live polls can
 * share round trips — fine for spectators, but in the admin it meant a just-saved score
 * could re-render as "Open" because the re-render after the Server Action got the cached
 * match list from just before the write (reported live on 11 okt: button said
 * "Opgeslagen", the court tile above still said "Open" until a manual refresh).
 * `force-no-store` overrides the per-fetch revalidate for everything rendered under
 * /admin, including the re-render that follows a Server Action.
 */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
