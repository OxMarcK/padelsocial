import type { PadelEvent } from "./types";
import type { Session } from "./session-types";

/** Today's calendar date in the club's own timezone (Europe/Amsterdam) as a
 * YYYY-MM-DD string — matches the plain date strings events/sessions store.
 * Comparing date strings directly sidesteps the server's own timezone
 * entirely (Vercel runs in UTC), which matters here: CEST is two hours
 * ahead of UTC, so a same-day comparison done in the server's local time can
 * still think it's "yesterday" for up to two hours after midnight has
 * already passed in Amsterdam — a session dated today then wrongly counts
 * as still upcoming instead of history for that whole window. */
function todayInAmsterdam(): string {
  // Not `new Intl.DateTimeFormat("en-CA", ...).format(...)` — en-CA's
  // YYYY-MM-DD output is a browser convention; Node's bundled ICU data
  // doesn't reliably carry it (it can silently fall back to M/D/YYYY),
  // which would make the string comparison below compare apples to
  // oranges. formatToParts with explicit numeric fields sidesteps any
  // locale's chosen order/separator entirely — we assemble the string
  // ourselves from the extracted year/month/day parts.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isPastDate(date: string): boolean {
  return date < todayInAmsterdam();
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

/** The flip side of isUpcomingPublicSession — a session belongs in the "Vorige
 * events" history once its date has passed, as long as it was ever actually
 * opened (a session left in "draft" never happened publicly, so it has no
 * history to show). */
export function isPastPublicSession(s: Session): boolean {
  return s.status !== "draft" && isPastDate(s.date);
}
