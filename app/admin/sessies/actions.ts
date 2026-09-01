"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { normalizeSlug, assertValidSlug } from "@/lib/slug";
import type { SessionStatus } from "@/lib/session-types";

function path(sessionId: string) {
  return `/admin/sessies/${sessionId}`;
}

export async function createSession(formData: FormData) {
  await requireAdmin();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(slug);
  if (await sessionsRepo.getSessionBySlug(slug)) {
    throw new Error(`"${slug}" is al in gebruik door een andere sessie.`);
  }
  const session = await sessionsRepo.createSession({
    title: String(formData.get("title") ?? ""),
    slug,
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    courts: Number(formData.get("courts") ?? 4),
    tikkieUrl: String(formData.get("tikkieUrl") ?? "").trim() || null,
  });
  revalidatePath("/admin/sessies");
  redirect(path(session.id));
}

export async function updateSessionDetails(sessionId: string, formData: FormData) {
  await requireAdmin();
  const session = await sessionsRepo.getSession(sessionId);
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(requestedSlug);
  if (requestedSlug !== session?.slug) {
    const existing = await sessionsRepo.getSessionBySlug(requestedSlug);
    if (existing && existing.id !== sessionId) {
      throw new Error(`"${requestedSlug}" is al in gebruik door een andere sessie.`);
    }
  }
  await sessionsRepo.updateSession(sessionId, {
    title: String(formData.get("title") ?? ""),
    slug: requestedSlug,
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    courts: Number(formData.get("courts") ?? 4),
    tikkieUrl: String(formData.get("tikkieUrl") ?? "").trim() || null,
  });
  revalidatePath(path(sessionId));
  revalidatePath("/admin/sessies");
  if (session && session.slug !== requestedSlug) {
    revalidatePath(`/sessies/${session.slug}`);
    revalidatePath(`/sessies/${requestedSlug}`);
  }
}

export async function setSessionStatus(sessionId: string, status: SessionStatus) {
  await requireAdmin();
  const session = await sessionsRepo.getSession(sessionId);
  await sessionsRepo.updateSession(sessionId, { status });
  revalidatePath(path(sessionId));
  revalidatePath("/admin/sessies");
  if (session) revalidatePath(`/sessies/${session.slug}`);
}

export async function deleteSession(sessionId: string) {
  await requireAdmin();
  await sessionsRepo.deleteSession(sessionId);
  revalidatePath("/admin/sessies");
  redirect("/admin/sessies");
}

export async function markReservationPaid(sessionId: string, reservationId: string) {
  await requireAdmin();
  await sessionsRepo.markPaid(reservationId);
  revalidatePath(path(sessionId));
}

export async function cancelReservation(sessionId: string, reservationId: string) {
  await requireAdmin();
  await sessionsRepo.cancelReservation(reservationId);
  revalidatePath(path(sessionId));
}
