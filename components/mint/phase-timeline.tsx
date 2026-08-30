import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { fmtTime, type PhaseWindow } from "@/lib/schedule";
import type { EventStatus } from "@/lib/types";

/** Design 6A trial variant of components/phase-timeline.tsx, restyled for the light "mint" palette. */
export function PhaseTimeline({ windows, currentStatus }: { windows: PhaseWindow[]; currentStatus: EventStatus }) {
  const byStatus = new Map(windows.map((w) => [w.status, w]));
  const statuses = PHASE_ORDER.filter((s) => s !== "finished");

  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-6 pb-1">
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
            className={`flex-none rounded-full px-4 py-2 shadow-[0_1px_3px_rgba(20,35,28,.08)] ${
              isCurrent ? "bg-mint-lime" : "bg-white"
            }`}
          >
            <div className={`font-mint text-sm font-bold ${isCurrent ? "text-[#0E2318]" : "text-mint-ink"}`}>
              {PHASE_META[status].label}
            </div>
            <div className={`text-xs ${isCurrent ? "text-[#0E2318]/70" : "text-mint-ink-muted"}`}>{timeText}</div>
          </div>
        );
      })}
    </div>
  );
}
