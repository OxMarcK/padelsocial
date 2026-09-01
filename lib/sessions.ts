import type { Reservation, Session } from "./session-types";

/** Fixed for v1 — see the plan discussion: can become a per-session setting later
 * (same escalation path as the tournament's wisseltijden) if 60 minutes turns out
 * to be wrong in practice. */
export const HOLD_MINUTES = 60;

/** No separate capacity field — derived from courts, same pattern as the
 * tournament's `event.courts` driving its own court-count math. */
export function sessionCapacity(session: Pick<Session, "courts">): number {
  return session.courts * 4;
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

export function isSessionFull(session: Pick<Session, "courts">, reservations: Reservation[], now: Date = new Date()): boolean {
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
