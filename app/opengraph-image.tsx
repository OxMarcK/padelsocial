import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { isUpcomingPublicEvent, isUpcomingPublicSession } from "@/lib/upcoming";
import { fmtEyebrow } from "@/lib/share-metadata";
import { renderOgCard, OG_SIZE } from "@/lib/og-card";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
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
  return renderOgCard({
    eyebrow: fmtEyebrow(featured.date, featured.startTime),
    title: isSession ? featured.title : featured.name,
    chips: [`${featured.courts} banen`, featured.location],
  });
}
