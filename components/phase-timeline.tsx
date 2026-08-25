import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { fmtTime, type PhaseWindow } from "@/lib/schedule";
import type { EventStatus } from "@/lib/types";

/** Horizontal "which phase are we in" strip — every phase of the day at a glance, current one highlighted. */
export function PhaseTimeline({ windows, currentStatus }: { windows: PhaseWindow[]; currentStatus: EventStatus }) {
  const byStatus = new Map(windows.map((w) => [w.status, w]));
  const statuses = PHASE_ORDER.filter((s) => s !== "finished");

  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {statuses.map((status) => {
        const window = byStatus.get(status);
        const isCurrent = status === currentStatus;
        const timeText = window
          ? window.endsAt
            ? `${fmtTime(window.startsAt)}–${fmtTime(window.endsAt)}`
            : `vanaf ${fmtTime(window.startsAt)}`
          : "";
        return (
          <div
            key={status}
            className={`flex-none rounded-2xl border px-4 py-2 ${
              isCurrent ? "border-lime-serve bg-lime-serve" : "border-flood-white/15"
            }`}
          >
            <div className={`font-display text-sm font-bold uppercase tracking-wide ${isCurrent ? "text-court-night" : "text-flood-white"}`}>
              {PHASE_META[status].label}
            </div>
            <div className={`text-xs ${isCurrent ? "text-court-night/70" : "text-ink-muted"}`}>{timeText}</div>
          </div>
        );
      })}
    </div>
  );
}
