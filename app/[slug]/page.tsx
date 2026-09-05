import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
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
