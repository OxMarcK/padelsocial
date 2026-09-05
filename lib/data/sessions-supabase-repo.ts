import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { HOLD_MINUTES, activeReservations, isReservationExpired, sessionCapacity } from "../sessions";
import type { Member, Reservation, Session } from "../session-types";
import type { NewMemberInput, NewSessionInput, SessionsRepo } from "./sessions-repo";

type Client = ReturnType<typeof supabaseAdmin>;

/** Supabase/Postgrest errors are plain objects, not Error instances — thrown as-is
 * they serialize as "[object Object]" with no message. Mirrors supabase-repo.ts's
 * own `raise` (duplicated, not imported — see the file-header note on why this repo
 * shares nothing with the tournament one). */
function raise(error: unknown): never {
  const message =
    error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : String(error);
  throw new Error(message);
}

function mapSession(row: any): Session {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    location: row.location,
    courts: row.courts,
    tikkieUrl: row.tikkie_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapMember(row: any): Member {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, level: row.level, createdAt: row.created_at };
}

function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    sessionId: row.session_id,
    memberId: row.member_id,
    status: row.status,
    reservedAt: row.reserved_at,
    holdExpiresAt: row.hold_expires_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

async function fetchSession(client: Client, id: string): Promise<Session> {
  const { data, error } = await client.from("sessions").select("*").eq("id", id).single();
  if (error || !data) throw new Error(`Session not found: ${id}`);
  return mapSession(data);
}

/** Sweeps expired holds into storage, then returns every reservation for the session. */
async function listReservationsInternal(client: Client, sessionId: string): Promise<Reservation[]> {
  const { data, error } = await client.from("reservations").select("*").eq("session_id", sessionId);
  if (error) raise(error);
  const rows = (data ?? []).map(mapReservation);

  const now = new Date();
  const expiredIds = rows.filter((r) => isReservationExpired(r, now)).map((r) => r.id);
  if (expiredIds.length > 0) {
    const { error: sweepError } = await client.from("reservations").update({ status: "expired" }).in("id", expiredIds);
    if (sweepError) raise(sweepError);
    for (const r of rows) if (expiredIds.includes(r.id)) r.status = "expired";
  }

  return rows.sort((a, b) => a.reservedAt.localeCompare(b.reservedAt));
}

export const sessionsSupabaseRepo: SessionsRepo = {
  async listSessions() {
    const client = supabaseAdmin();
    const { data, error } = await client.from("sessions").select("*").order("created_at", { ascending: false });
    if (error) raise(error);
    return (data ?? []).map(mapSession);
  },

  async getSession(id) {
    const client = supabaseAdmin();
    const { data, error } = await client.from("sessions").select("*").eq("id", id).maybeSingle();
    if (error) raise(error);
    return data ? mapSession(data) : null;
  },

  async getSessionBySlug(slug) {
    const client = supabaseAdmin();
    const { data, error } = await client.from("sessions").select("*").eq("slug", slug).maybeSingle();
    if (error) raise(error);
    return data ? mapSession(data) : null;
  },

  async createSession(input: NewSessionInput) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("sessions")
      .insert({
        slug: input.slug,
        title: input.title,
        date: input.date,
        start_time: input.startTime,
        location: input.location,
        courts: input.courts,
        tikkie_url: input.tikkieUrl,
      })
      .select()
      .single();
    if (error) raise(error);
    return mapSession(data);
  },

  async updateSession(id, patch) {
    const client = supabaseAdmin();
    const update: Record<string, unknown> = {};
    if (patch.slug !== undefined) update.slug = patch.slug;
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.date !== undefined) update.date = patch.date;
    if (patch.startTime !== undefined) update.start_time = patch.startTime;
    if (patch.location !== undefined) update.location = patch.location;
    if (patch.courts !== undefined) update.courts = patch.courts;
    if (patch.tikkieUrl !== undefined) update.tikkie_url = patch.tikkieUrl;
    if (patch.status !== undefined) update.status = patch.status;
    const { data, error } = await client.from("sessions").update(update).eq("id", id).select().single();
    if (error) raise(error);
    return mapSession(data);
  },

  async deleteSession(id) {
    const client = supabaseAdmin();
    const { error } = await client.from("sessions").delete().eq("id", id);
    if (error) raise(error);
  },

  async listMembers() {
    const client = supabaseAdmin();
    const { data, error } = await client.from("members").select("*").order("name", { ascending: true });
    if (error) raise(error);
    return (data ?? []).map(mapMember);
  },

  async addMembersBulk(input: NewMemberInput[]) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("members")
      .insert(input.map((m) => ({ name: m.name, email: m.email ?? null, phone: m.phone ?? null, level: m.level ?? null })))
      .select();
    if (error) raise(error);
    return (data ?? []).map(mapMember);
  },

  async updateMember(id, name) {
    const client = supabaseAdmin();
    const { data, error } = await client.from("members").update({ name }).eq("id", id).select().single();
    if (error) raise(error);
    return mapMember(data);
  },

  async deleteMember(id) {
    const client = supabaseAdmin();
    const { error } = await client.from("members").delete().eq("id", id);
    if (error) raise(error);
  },

  async listReservations(sessionId) {
    const client = supabaseAdmin();
    return listReservationsInternal(client, sessionId);
  },

  async reserveSpot(sessionId, memberId) {
    const client = supabaseAdmin();
    const session = await fetchSession(client, sessionId);
    if (session.status !== "open") throw new Error("Aanmelden is nog niet open voor deze sessie.");

    const reservations = await listReservationsInternal(client, sessionId);
    const existing = reservations.find((r) => r.memberId === memberId && (r.status === "held" || r.status === "paid"));
    if (existing) return existing;

    if (activeReservations(reservations).length >= sessionCapacity(session)) {
      throw new Error("Deze sessie zit vol.");
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();
    const { data, error } = await client
      .from("reservations")
      .insert({ session_id: sessionId, member_id: memberId, status: "held", hold_expires_at: holdExpiresAt })
      .select()
      .single();
    if (error) raise(error);
    return mapReservation(data);
  },

  async markPaid(reservationId) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("reservations")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", reservationId)
      .select()
      .single();
    if (error) raise(error);
    return mapReservation(data);
  },

  async cancelReservation(reservationId) {
    const client = supabaseAdmin();
    const { error } = await client.from("reservations").update({ status: "cancelled" }).eq("id", reservationId);
    if (error) raise(error);
  },
};
