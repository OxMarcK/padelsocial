"use client";

import { useState, useTransition } from "react";
import type { Member, Reservation } from "@/lib/session-types";

/**
 * The "existing member" path — pick your name from the admin-managed list.
 * Mobile-first: one dropdown, one big thumb-sized button. Reports the
 * resulting reservation up via onReserved rather than rendering its own
 * confirmation, so components/sessions/signup-flow.tsx can show one shared
 * confirmation view regardless of which path (this, or first-time-form) got
 * there.
 */
export function SignupForm({
  sessionId,
  members,
  reserveSpot,
  onReserved,
}: {
  sessionId: string;
  members: Member[];
  reserveSpot: (sessionId: string, formData: FormData) => Promise<Reservation>;
  onReserved: (reservation: Reservation) => void;
}) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (members.length === 0) {
    return <p className="text-sm text-mint-ink-muted">Er staan nog geen leden in het systeem.</p>;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("memberId", memberId);
    startTransition(async () => {
      try {
        onReserved(await reserveSpot(sessionId, formData));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Er ging iets mis.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-mint text-lg font-bold text-[#0E2318]">Wie ben jij?</span>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="h-12 rounded-xl border border-mint-net/25 bg-white px-3 text-mint-ink"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-xs text-clay-orange">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !memberId}
        className="h-12 rounded-2xl bg-mint-lime font-mint font-bold uppercase tracking-wider text-mint-lime-ink transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Bezig…" : "Meld je aan"}
      </button>
    </form>
  );
}
