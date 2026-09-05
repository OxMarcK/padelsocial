"use client";

import { useState } from "react";
import type { Member, Reservation } from "@/lib/session-types";
import { FirstTimeForm } from "./first-time-form";
import { SignupForm } from "./signup-form";
import { ReservationConfirmation } from "./reservation-confirmation";

/**
 * Toggles between the two signup paths — "first time here?" (self-service,
 * creates a member on the spot) and "ik heb al een clubprofiel" (the existing
 * admin-managed member dropdown) — and owns the resulting reservation so a
 * successful signup on either path replaces both with one shared confirmation.
 */
export function SignupFlow({
  sessionId,
  members,
  tikkieUrl,
  reserveSpot,
  createMemberAndReserve,
}: {
  sessionId: string;
  members: Member[];
  tikkieUrl: string | null;
  reserveSpot: (sessionId: string, formData: FormData) => Promise<Reservation>;
  createMemberAndReserve: (sessionId: string, formData: FormData) => Promise<Reservation>;
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  if (reservation) {
    return <ReservationConfirmation reservation={reservation} tikkieUrl={tikkieUrl} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "new" ? (
        <FirstTimeForm sessionId={sessionId} createMemberAndReserve={createMemberAndReserve} onReserved={setReservation} />
      ) : (
        <SignupForm sessionId={sessionId} members={members} reserveSpot={reserveSpot} onReserved={setReservation} />
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-mint-net/20" />
        <span className="text-xs text-mint-ink-muted">of</span>
        <div className="h-px flex-1 bg-mint-net/20" />
      </div>

      <button
        type="button"
        onClick={() => setMode(mode === "new" ? "existing" : "new")}
        className="h-12 rounded-full bg-mint-lime/30 font-mint text-sm font-bold text-mint-lime-ink transition hover:brightness-95"
      >
        {mode === "new" ? "Ik heb al een clubprofiel" : "Eerste keer hier?"}
      </button>
    </div>
  );
}
