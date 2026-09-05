import { HOLD_MINUTES, activeReservations, isReservationExpired, sessionCapacity } from "../sessions";
import type { Member, Reservation, Session } from "../session-types";
import type { NewMemberInput, NewSessionInput, SessionsRepo } from "./sessions-repo";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

class SessionsMockStore {
  sessions = new Map<string, Session>();
  members = new Map<string, Member>();
  reservations = new Map<string, Reservation>();
}

// module-singleton so state survives across requests within the same dev server
// process — without this, separate route bundles (e.g. the opengraph-image route)
// each get their own fresh, empty store instead of sharing one (mirrors the same
// fix already applied to lib/data/mock-repo.ts).
const store: SessionsMockStore = (globalThis as any).__padelSocialSessionsMockStore ?? new SessionsMockStore();
(globalThis as any).__padelSocialSessionsMockStore = store;

function requireSession(id: string): Session {
  const session = store.sessions.get(id);
  if (!session) throw new Error(`Session not found: ${id}`);
  return session;
}

/** Sweeps expired holds into storage, then returns every reservation for the session. */
function listReservationsInternal(sessionId: string): Reservation[] {
  const now = new Date();
  const rows = Array.from(store.reservations.values()).filter((r) => r.sessionId === sessionId);
  for (const r of rows) {
    if (isReservationExpired(r, now)) {
      r.status = "expired";
      store.reservations.set(r.id, r);
    }
  }
  return rows.sort((a, b) => a.reservedAt.localeCompare(b.reservedAt));
}

export const sessionsMockRepo: SessionsRepo = {
  async listSessions() {
    return Array.from(store.sessions.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getSession(id) {
    return store.sessions.get(id) ?? null;
  },

  async getSessionBySlug(slug) {
    return Array.from(store.sessions.values()).find((s) => s.slug === slug) ?? null;
  },

  async createSession(input: NewSessionInput) {
    const session: Session = {
      id: uid("session"),
      ...input,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    store.sessions.set(session.id, session);
    return session;
  },

  async updateSession(id, patch) {
    const session = requireSession(id);
    const updated: Session = { ...session, ...patch };
    store.sessions.set(id, updated);
    return updated;
  },

  async deleteSession(id) {
    store.sessions.delete(id);
    for (const [rid, r] of store.reservations) if (r.sessionId === id) store.reservations.delete(rid);
  },

  async listMembers() {
    return Array.from(store.members.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  async addMembersBulk(input: NewMemberInput[]) {
    const created: Member[] = [];
    for (const m of input) {
      const member: Member = {
        id: uid("member"),
        name: m.name,
        email: m.email ?? null,
        phone: m.phone ?? null,
        level: m.level ?? null,
        createdAt: new Date().toISOString(),
      };
      store.members.set(member.id, member);
      created.push(member);
    }
    return created;
  },

  async updateMember(id, patch) {
    const member = store.members.get(id);
    if (!member) throw new Error(`Member not found: ${id}`);
    const updated = { ...member, name: patch.name, ...(patch.level !== undefined ? { level: patch.level } : {}) };
    store.members.set(id, updated);
    return updated;
  },

  async deleteMember(id) {
    store.members.delete(id);
  },

  async listReservations(sessionId) {
    return listReservationsInternal(sessionId);
  },

  async reserveSpot(sessionId, memberId) {
    const session = requireSession(sessionId);
    if (session.status !== "open") throw new Error("Aanmelden is nog niet open voor deze sessie.");

    const reservations = listReservationsInternal(sessionId);
    const existing = reservations.find((r) => r.memberId === memberId && (r.status === "held" || r.status === "paid"));
    if (existing) return existing;

    if (activeReservations(reservations).length >= sessionCapacity(session)) {
      throw new Error("Deze sessie zit vol.");
    }

    const now = new Date();
    const reservation: Reservation = {
      id: uid("reservation"),
      sessionId,
      memberId,
      status: "held",
      reservedAt: now.toISOString(),
      holdExpiresAt: new Date(now.getTime() + HOLD_MINUTES * 60_000).toISOString(),
      paidAt: null,
      createdAt: now.toISOString(),
    };
    store.reservations.set(reservation.id, reservation);
    return reservation;
  },

  async markPaid(reservationId) {
    const reservation = store.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservering niet gevonden.");
    const updated: Reservation = { ...reservation, status: "paid", paidAt: new Date().toISOString() };
    store.reservations.set(reservationId, updated);
    return updated;
  },

  async cancelReservation(reservationId) {
    const reservation = store.reservations.get(reservationId);
    if (!reservation) return;
    store.reservations.set(reservationId, { ...reservation, status: "cancelled" });
  },
};
