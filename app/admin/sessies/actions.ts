"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { normalizeSlug, assertValidSlug } from "@/lib/slug";
import { isSlugTaken } from "@/lib/slug-registry";
import { parseCourtNumbers } from "@/lib/sessions";
import type { SessionStatus } from "@/lib/session-types";

function path(sessionId: string) {
  return `/admin/sessies/${sessionId}`;
}

function readCourtNumbers(formData: FormData): number[] {
  const courtNumbers = parseCourtNumbers(String(formData.get("courtNumbers") ?? ""));
  if (courtNumbers.length === 0) {
    throw new Error("Vul minimaal één baannummer in, bijvoorbeeld \"1, 2, 3, 4\".");
  }
  return courtNumbers;
}

export async function createSession(formData: FormData) {
  await requireAdmin();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(slug);
  if (await isSlugTaken(slug)) {
    throw new Error(`"${slug}" is al in gebruik door een andere sessie.`);
  }
  const session = await sessionsRepo.createSession({
    title: String(formData.get("title") ?? ""),
    slug,
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    courtNumbers: readCourtNumbers(formData),
    tikkieUrl: String(formData.get("tikkieUrl") ?? "").trim() || null,
  });
  revalidatePath("/admin/sessies");
  revalidatePath("/");
  redirect(path(session.id));
}

export async function updateSessionDetails(sessionId: string, formData: FormData) {
  await requireAdmin();
  const session = await sessionsRepo.getSession(sessionId);
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(requestedSlug);
  if (requestedSlug !== session?.slug && (await isSlugTaken(requestedSlug, { kind: "session", id: sessionId }))) {
    throw new Error(`"${requestedSlug}" is al in gebruik door een andere sessie.`);
  }
  await sessionsRepo.updateSession(sessionId, {
    title: String(formData.get("title") ?? ""),
    slug: requestedSlug,
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    courtNumbers: readCourtNumbers(formData),
    tikkieUrl: String(formData.get("tikkieUrl") ?? "").trim() || null,
  });
  revalidatePath(path(sessionId));
  revalidatePath("/admin/sessies");
  revalidatePath("/");
  if (session && session.slug !== requestedSlug) {
    revalidatePath(`/${session.slug}`);
    revalidatePath(`/${requestedSlug}`);
  }
}

export async function setSessionStatus(sessionId: string, status: SessionStatus) {
  await requireAdmin();
  const session = await sessionsRepo.getSession(sessionId);
  await sessionsRepo.updateSession(sessionId, { status });
  revalidatePath(path(sessionId));
  revalidatePath("/admin/sessies");
  revalidatePath("/");
  if (session) revalidatePath(`/${session.slug}`);
}

export async function deleteSession(sessionId: string) {
  await requireAdmin();
  await sessionsRepo.deleteSession(sessionId);
  revalidatePath("/admin/sessies");
  revalidatePath("/");
  redirect("/admin/sessies");
}

export async function setCourtVideo(sessionId: string, courtNumber: number, formData: FormData) {
  await requireAdmin();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const session = await sessionsRepo.setCourtVideo(sessionId, courtNumber, videoUrl || null);
  revalidatePath(path(sessionId));
  revalidatePath(`/${session.slug}`);
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
