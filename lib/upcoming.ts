import type { PadelEvent } from "./types";
import type { Session } from "./session-types";

export function isPastDate(date: string): boolean {
  const d = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/**
 * Any event that isn't finished yet is "upcoming" — including one still in
 * "draft" (Inchecken), regardless of how far out its date is. People should
 * be able to find the event and its schedule as soon as it exists, not only
 * once its own morning arrives (previously drafts were hidden entirely,
 * which also made a live event vanish from the landing page right when
 * people were arriving and looking for it).
 */
export function isUpcomingPublicEvent(e: PadelEvent): boolean {
  return e.status !== "finished";
}

/**
 * A session is worth surfacing once it's open for signup or already closed
 * (still relevant — people who signed up still want to find it) and hasn't
 * happened yet. Unlike a tournament, a "draft" session stays hidden: a concept
 * tournament is still shown per isUpcomingPublicEvent's reasoning above, but a
 * draft session isn't something anyone can act on yet, and there's always
 * another one coming next week — no urgency to reveal it early.
 */
export function isUpcomingPublicSession(s: Session): boolean {
  return (s.status === "open" || s.status === "closed") && !isPastDate(s.date);
}
