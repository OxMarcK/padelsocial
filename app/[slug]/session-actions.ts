"use server";

import { sessionsRepo } from "@/lib/data/sessions";
import type { MemberLevel } from "@/lib/session-types";

/**
 * Idempotent by design (see SessionsRepo.reserveSpot): a member who already has
 * an active reservation just gets it back, which is also how "meld je aan"
 * doubles as "check mijn status" without needing a login/cookie.
 */
export async function reserveSpotAction(sessionId: string, formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) throw new Error("Kies je naam uit de lijst.");
  return sessionsRepo.reserveSpot(sessionId, memberId);
}

const MEMBER_LEVELS: MemberLevel[] = ["beginner", "beginner_plus", "intermediate"];

/**
 * The self-service "first time here?" path: creates a club-member profile on
 * the spot (name + email + level — no admin gatekeeping) and reserves a spot
 * for them in one go. Matches on email first so re-submitting the form (or a
 * returning player who forgot they'd already done this) reuses the existing
 * profile instead of creating a duplicate.
 */
export async function createMemberAndReserveAction(sessionId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const level = String(formData.get("level") ?? "") as MemberLevel | "";

  if (!name) throw new Error("Vul je naam in.");
  if (!email || !email.includes("@")) throw new Error("Vul een geldig e-mailadres in.");
  if (!MEMBER_LEVELS.includes(level as MemberLevel)) throw new Error("Kies hoe je speelt.");
  const validLevel = level as MemberLevel;

  const members = await sessionsRepo.listMembers();
  const existing = members.find((m) => m.email && m.email.toLowerCase() === email.toLowerCase());
  const member = existing ?? (await sessionsRepo.addMembersBulk([{ name, email, level: validLevel }]))[0];
  if (!member) throw new Error("Aanmaken van je profiel is niet gelukt.");

  return sessionsRepo.reserveSpot(sessionId, member.id);
}
