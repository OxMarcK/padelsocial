"use server";

import { sessionsRepo } from "@/lib/data/sessions";

/**
 * The one public write action in the whole app — everywhere else, an admin adds
 * data on someone's behalf. Idempotent by design (see SessionsRepo.reserveSpot):
 * a member who already has an active reservation just gets it back, which is also
 * how "meld je aan" doubles as "check mijn status" without needing a login/cookie.
 */
export async function reserveSpotAction(sessionId: string, formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) throw new Error("Kies je naam uit de lijst.");
  return sessionsRepo.reserveSpot(sessionId, memberId);
}
