/**
 * Domain types for the weekly-session sign-up feature — deliberately its own file,
 * not added to lib/types.ts, so the tournament domain model stays untouched. See
 * lib/sessions.ts for the pure logic and lib/data/sessions-repo.ts for the repo
 * contract these feed into.
 */

export type SessionStatus = "draft" | "open" | "closed" | "done";

export interface Session {
  id: string;
  slug: string;
  title: string;
  date: string;
  startTime: string;
  location: string;
  courts: number;
  /** One shared payment-request link for the whole session (same as the WhatsApp-group
   * Tikkie the organizer already sends today) — not a per-person link. */
  tikkieUrl: string | null;
  status: SessionStatus;
  createdAt: string;
}

/** Determines which court a member starts on for the "wisselend" up/down format —
 * not used for court assignment yet, but persisted from the moment a member
 * signs up so it's already there once that feature is built. */
export type MemberLevel = "beginner" | "beginner_plus" | "intermediate";

export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  level: MemberLevel | null;
  createdAt: string;
}

export type ReservationStatus = "held" | "paid" | "expired" | "cancelled";

export interface Reservation {
  id: string;
  sessionId: string;
  memberId: string;
  status: ReservationStatus;
  reservedAt: string;
  /** Only meaningful while status is "held" — see lib/sessions.ts's isReservationExpired. */
  holdExpiresAt: string;
  paidAt: string | null;
  createdAt: string;
}
