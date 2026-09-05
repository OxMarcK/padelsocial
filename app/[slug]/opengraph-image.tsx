import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { fmtEyebrow } from "@/lib/share-metadata";
import { renderOgCard, OG_SIZE } from "@/lib/og-card";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (event) {
    return renderOgCard({
      eyebrow: fmtEyebrow(event.date, event.startTime),
      title: event.name,
      chips: [`${event.courts} banen`, event.location],
    });
  }

  const session = await sessionsRepo.getSessionBySlug(params.slug);
  if (session) {
    return renderOgCard({
      eyebrow: fmtEyebrow(session.date, session.startTime),
      title: session.title,
      chips: [`${session.courts} banen`, session.location],
    });
  }

  return renderOgCard({ eyebrow: "", title: "Padel Social", chips: [] });
}
