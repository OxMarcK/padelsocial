import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { fmtEyebrow } from "@/lib/share-metadata";
import { renderOgCard, OG_SIZE } from "@/lib/og-card";
import { generatePouleSchedule, playedCourts } from "@/lib/poule-scheduler";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (event) {
    // event.courts is the highest court number (courts 2-5 => 5), so count the
    // courts the poule schedule actually uses instead.
    const poules = await repo.listPoules(event.id);
    const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
    const courtCount = playedCourts(schedule, event.courts).length;
    return renderOgCard({
      eyebrow: fmtEyebrow(event.date, event.startTime),
      title: event.name,
      chips: [`${courtCount} banen`, event.location],
    });
  }

  const session = await sessionsRepo.getSessionBySlug(params.slug);
  if (session) {
    return renderOgCard({
      eyebrow: fmtEyebrow(session.date, session.startTime),
      title: session.title,
      chips: [`${session.courtNumbers.length} banen`, session.location],
    });
  }

  return renderOgCard({ eyebrow: "", title: "Padel Social", chips: [] });
}
