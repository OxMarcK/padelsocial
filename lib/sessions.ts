import type { Reservation, Session } from "./session-types";

/** Fixed for v1 — see the plan discussion: can become a per-session setting later
 * (same escalation path as the tournament's wisseltijden) if 60 minutes turns out
 * to be wrong in practice. */
export const HOLD_MINUTES = 60;

/** No separate capacity field — derived from how many baannummers the session
 * has, same pattern as the tournament's `event.courts` driving its own
 * court-count math (there it's a plain count; here it's a list because the
 * baannummers themselves can be anything, see session-types.ts). */
export function sessionCapacity(session: Pick<Session, "courtNumbers">): number {
  return session.courtNumbers.length * 4;
}

/** Parses the admin's comma-separated "Baannummers" input (e.g. "3, 5, 7, 12")
 * into a deduplicated list of positive integers, preserving input order. */
export function parseCourtNumbers(input: string): number[] {
  const seen = new Set<number>();
  for (const part of input.split(",")) {
    const n = Number(part.trim());
    if (Number.isFinite(n) && n > 0) seen.add(n);
  }
  return Array.from(seen);
}

/** Inverse of parseCourtNumbers, for pre-filling the admin form. */
export function formatCourtNumbers(courtNumbers: number[]): string {
  return courtNumbers.join(", ");
}

const ACTIVE_STATUSES: Reservation["status"][] = ["held", "paid"];

export function isActiveReservation(reservation: Reservation): boolean {
  return ACTIVE_STATUSES.includes(reservation.status);
}

/** A "held" reservation past its hold window is expired — regardless of whether
 * that's been written back to storage yet. Every repo read sweeps this (see
 * lib/data/sessions-mock-repo.ts / sessions-supabase-repo.ts) so nothing needs a
 * background job: the check just has to be cheap and correct wherever it runs. */
export function isReservationExpired(reservation: Reservation, now: Date = new Date()): boolean {
  return reservation.status === "held" && new Date(reservation.holdExpiresAt).getTime() < now.getTime();
}

/** Reservations still actually holding a spot, after accounting for holds that
 * have quietly expired but may not be swept in storage yet. */
export function activeReservations(reservations: Reservation[], now: Date = new Date()): Reservation[] {
  return reservations.filter((r) => isActiveReservation(r) && !isReservationExpired(r, now));
}

export function isSessionFull(session: Pick<Session, "courtNumbers">, reservations: Reservation[], now: Date = new Date()): boolean {
  return activeReservations(reservations, now).length >= sessionCapacity(session);
}

export function findActiveReservationForMember(
  reservations: Reservation[],
  memberId: string,
  now: Date = new Date()
): Reservation | null {
  return activeReservations(reservations, now).find((r) => r.memberId === memberId) ?? null;
}

/** Every session runs in the Netherlands — same fixed zone as the tournament side
 * (lib/schedule.ts), duplicated here rather than imported to keep the two features
 * from sharing any code. */
export function fmtClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
}
