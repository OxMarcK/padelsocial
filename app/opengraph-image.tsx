import { headers } from "next/headers";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { isUpcomingPublicEvent, isUpcomingPublicSession } from "@/lib/upcoming";
import { fmtEyebrow } from "@/lib/share-metadata";
import { renderOgCard, OG_SIZE } from "@/lib/og-card";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  // `export const dynamic = "force-dynamic"` is silently ignored for this
  // special opengraph-image file convention in this Next.js version — the
  // route still gets prerendered once during `next build` regardless,
  // meaning a live Supabase call happens at build time. Any transient
  // Supabase hiccup there (e.g. a JWT clock-skew error) then fails the
  // whole deploy instead of just one request. Calling headers() is the one
  // dynamic-API opt-out Next does reliably honor everywhere (it's the same
  // reason app/[slug]/session-view.tsx never hit this) — it forces
  // request-time rendering, so a blip here is just one slow/retried request.
  headers();

  const [events, sessions] = await Promise.all([repo.listEvents(), sessionsRepo.listSessions()]);
  const upcoming = events.find(isUpcomingPublicEvent);
  const nextSession = sessions.filter(isUpcomingPublicSession).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  // Same "soonest wins" rule the landing page itself uses to order the two.
  const sessionFirst = upcoming && nextSession ? nextSession.date < upcoming.date : Boolean(nextSession);
  const featured = sessionFirst ? nextSession : (upcoming ?? nextSession);

  if (!featured) {
    return renderOgCard({ eyebrow: "", title: "Padel Social", chips: [] });
  }

  const isSession = "title" in featured;
  const courtsCount = isSession ? featured.courtNumbers.length : featured.courts;
  return renderOgCard({
    eyebrow: fmtEyebrow(featured.date, featured.startTime),
    title: isSession ? featured.title : featured.name,
    chips: [`${courtsCount} banen`, featured.location],
  });
}
