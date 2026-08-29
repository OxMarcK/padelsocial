import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { fmtTime, type PhaseWindow } from "@/lib/schedule";
import type { EventStatus } from "@/lib/types";

/** Design 6A trial variant of components/phase-timeline.tsx, restyled for the light "mint" palette. */
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
            className={`flex-none rounded-full border px-4 py-2 ${
              isCurrent ? "border-mint-lime bg-mint-lime" : "border-mint-net/40 bg-mint-surface"
            }`}
          >
            <div className={`font-mint text-sm font-bold ${isCurrent ? "text-mint-lime-ink" : "text-mint-ink"}`}>
              {PHASE_META[status].label}
            </div>
            <div className={`text-xs ${isCurrent ? "text-mint-lime-ink/70" : "text-mint-ink-muted"}`}>{timeText}</div>
          </div>
        );
      })}
    </div>
  );
}
