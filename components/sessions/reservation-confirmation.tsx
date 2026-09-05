import { fmtClockTime } from "@/lib/sessions";
import type { Reservation } from "@/lib/session-types";

/** Shared confirmation view for both signup paths (existing member and
 * first-time self-service) — same reservation, same next step, so one view. */
export function ReservationConfirmation({ reservation, tikkieUrl }: { reservation: Reservation; tikkieUrl: string | null }) {
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
