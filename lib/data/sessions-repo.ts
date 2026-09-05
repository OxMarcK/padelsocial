import type { Member, MemberLevel, Reservation, Session, SessionStatus } from "../session-types";

export interface NewSessionInput {
  slug: string;
  title: string;
  date: string;
  startTime: string;
  location: string;
  courts: number;
  tikkieUrl: string | null;
}

export interface NewMemberInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  level?: MemberLevel | null;
}

/**
 * The read/write contract for the weekly-session sign-up feature — a sibling of
 * lib/data/repo.ts (the tournament contract), not an extension of it. Kept fully
 * separate on purpose: sessions and tournaments share nothing but the Supabase
 * project and the admin login, so a bug or change here can never reach the
 * tournament side and vice versa. Two implementations, same env-driven selection
 * pattern as lib/data/index.ts — see lib/data/sessions.ts.
 */
export interface SessionsRepo {
  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  getSessionBySlug(slug: string): Promise<Session | null>;
  createSession(input: NewSessionInput): Promise<Session>;
  updateSession(id: string, patch: Partial<NewSessionInput> & { status?: SessionStatus }): Promise<Session>;
  deleteSession(id: string): Promise<void>;

  listMembers(): Promise<Member[]>;
  addMembersBulk(input: NewMemberInput[]): Promise<Member[]>;
  updateMember(id: string, name: string): Promise<Member>;
  deleteMember(id: string): Promise<void>;

  /** Sweeps expired holds to status "expired" before returning — always the
   * up-to-date view, never a stale "held" that's actually past its window. */
  listReservations(sessionId: string): Promise<Reservation[]>;
  /**
   * Idempotent: a member with an existing active (held/paid) reservation for
   * this session gets that same reservation back instead of a duplicate — this
   * is also how the public page answers "wait, did I already sign up?" without
   * needing a cookie or login (see the plan's no-self-cancel decision).
   * Throws a Dutch, user-facing message when the session isn't open or is full.
   */
  reserveSpot(sessionId: string, memberId: string): Promise<Reservation>;
  markPaid(reservationId: string): Promise<Reservation>;
  /** Admin-only per the plan — there's no public-facing cancel action. */
  cancelReservation(reservationId: string): Promise<void>;
}
