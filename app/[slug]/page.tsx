import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { buildShareMetadata, fmtDateShort } from "@/lib/share-metadata";
import { TournamentEventPage } from "./tournament-view";
import { SessionSignupView } from "./session-view";

/**
 * The flat /{slug} namespace hosts two independent kinds of public pages —
 * tournament events (lib/data/repo.ts) and weekly sessions (lib/data/sessions.ts,
 * a fully separate repo/interface). This dispatcher is the ONLY place that knows
 * both exist: it checks tournaments first, then sessions, and delegates rendering
 * to a dedicated view per kind. Neither view imports from the other, and neither
 * repo knows about the other — the coupling here is routing-only, not a data-model
 * merge (see the "unifying sessions & tournaments" plan for the full rationale).
 */
export default async function SlugPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (event) return <TournamentEventPage event={event} />;

  const session = await sessionsRepo.getSessionBySlug(params.slug);
  if (session) return <SessionSignupView session={session} />;

  notFound();
}

/** Per-slug link-preview metadata — a tournament or session's own name/date
 * instead of the root layout's generic fallback, so sharing a link (WhatsApp,
 * "Nodig iemand uit") shows what's actually being shared. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await repo.getEventBySlug(params.slug);
  if (event) {
    const title = `${event.name} - ${fmtDateShort(event.date, event.startTime)}`;
    return buildShareMetadata(title, `${event.location} · Volg live de standen, je baanindeling en de knock-out.`);
  }

  const session = await sessionsRepo.getSessionBySlug(params.slug);
  if (session) {
    const title = `${session.title} - ${fmtDateShort(session.date, session.startTime)}`;
    return buildShareMetadata(title, `${session.location} · Meld je aan voor deze sessie.`);
  }

  return {};
}
