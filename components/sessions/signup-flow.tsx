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
  const [confirmed, setConfirmed] = useState<{ reservation: Reservation; name: string } | null>(null);

  function handleReserved(reservation: Reservation, name: string) {
    setConfirmed({ reservation, name });
  }

  if (confirmed) {
    return <ReservationConfirmation reservation={confirmed.reservation} name={confirmed.name} tikkieUrl={tikkieUrl} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "new" ? (
        <FirstTimeForm sessionId={sessionId} createMemberAndReserve={createMemberAndReserve} onReserved={handleReserved} />
      ) : (
        <SignupForm sessionId={sessionId} members={members} reserveSpot={reserveSpot} onReserved={handleReserved} />
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-mint-net/20" />
        <span className="text-xs text-mint-ink-muted">of</span>
        <div className="h-px flex-1 bg-mint-net/20" />
      </div>

      <button
        type="button"
        onClick={() => setMode(mode === "new" ? "existing" : "new")}
        className="flex h-[54px] items-center justify-center rounded-full border-2 border-[#0E2318]/[.10] font-mint text-base font-bold text-[#0E2318] transition hover:border-[#4F6E14]"
      >
        {mode === "new" ? "Ik heb al een clubprofiel" : "Eerste keer hier?"}
      </button>
    </div>
  );
}
