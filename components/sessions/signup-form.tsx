"use client";

import { useState, useTransition } from "react";
import { fmtClockTime } from "@/lib/sessions";
import type { Member, Reservation } from "@/lib/session-types";

/**
 * Mobile-first: one dropdown, one big thumb-sized button, nothing else — this is
 * meant to be filled in on a phone from a WhatsApp link. Calling the action
 * directly (not a plain <form action>) so the returned Reservation can drive an
 * inline confirmation without a page reload.
 */
export function SignupForm({
  sessionId,
  members,
  tikkieUrl,
  reserveSpot,
}: {
  sessionId: string;
  members: Member[];
  tikkieUrl: string | null;
  reserveSpot: (sessionId: string, formData: FormData) => Promise<Reservation>;
}) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (members.length === 0) {
    return <p className="text-sm text-mint-ink-muted">Er staan nog geen leden in het systeem.</p>;
  }

  if (reservation) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-mint-lime bg-mint-lime/15 p-4 text-sm text-mint-ink">
        {reservation.status === "paid" ? (
          <p>Je plek is bevestigd — tot op de baan! 🎾</p>
        ) : (
          <>
            <p>
              Je plek is gereserveerd tot{" "}
              <span className="font-bold tabular-nums">{fmtClockTime(reservation.holdExpiresAt)}</span>. Betaal binnen
              dat uur via Tikkie, anders vervalt je plek weer.
            </p>
            {tikkieUrl ? (
              <a
                href={tikkieUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center justify-center rounded-2xl bg-mint-lime px-6 text-center font-mint font-bold uppercase tracking-wider text-mint-lime-ink"
              >
                Betaal via Tikkie
              </a>
            ) : (
              <p className="text-xs text-mint-ink-muted">Er is nog geen betaallink ingesteld — vraag de organisator.</p>
            )}
          </>
        )}
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("memberId", memberId);
    startTransition(async () => {
      try {
        setReservation(await reserveSpot(sessionId, formData));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Er ging iets mis.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[#0E2318]">Wie ben jij?</span>
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
