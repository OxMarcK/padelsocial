export type PhaseKind = "pre" | "live" | "pauze" | "ceremony" | "done";

export interface PhaseIndicatorProps {
  phaseLabel: string;
  subLabel: string;
  timeWindowText: string;
  nextLine: string;
  kind: PhaseKind;
  countdownText?: string;
  progress?: number;
}

const KIND_STYLES: Record<PhaseKind, { bg: string; border: string; dot: string }> = {
  pre: { bg: "bg-glass-blue/10", border: "border-glass-blue", dot: "bg-glass-blue" },
  live: { bg: "bg-mint-surface", border: "border-mint-net/30", dot: "bg-mint-lime" },
  pauze: { bg: "bg-mint-lime/15", border: "border-mint-lime", dot: "bg-mint-lime" },
  ceremony: { bg: "bg-clay-orange/10", border: "border-clay-orange", dot: "bg-clay-orange" },
  done: { bg: "bg-mint-surface", border: "border-mint-net/30", dot: "bg-mint-net" },
};

/** Design 6A trial variant of components/phase-indicator.tsx, restyled for the light "mint" palette. */
export function PhaseIndicator({ phaseLabel, subLabel, timeWindowText, nextLine, kind, countdownText, progress }: PhaseIndicatorProps) {
  if (kind === "pre" || kind === "pauze" || kind === "ceremony") {
    return <BillboardIndicator {...{ phaseLabel, subLabel, timeWindowText, nextLine, countdownText, progress }} />;
  }

  const styles = KIND_STYLES[kind];
  return (
    <div className={`rounded-[28px] border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot} ${kind === "live" ? "animate-pulse2" : ""}`} />
        <span className="font-mint text-lg font-bold text-mint-lime-ink">{phaseLabel}</span>
        {countdownText ? (
          <span className="ml-auto font-mint text-4xl font-bold leading-none tabular-nums text-mint-ink">{countdownText}</span>
        ) : null}
      </div>
      {typeof progress === "number" ? (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-mint-net/30">
          <div
            className="h-full rounded-full bg-mint-lime transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      ) : null}
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-mint-ink-muted">
        <span>{subLabel}</span>
        <span>{timeWindowText}</span>
      </div>
      <div className="mt-2.5 border-t border-mint-net/25 pt-2.5 text-sm text-mint-ink">{nextLine}</div>
    </div>
  );
}

/**
 * The "billboard" treatment for pre/pauze/ceremony (per the canvas
 * reference): a solid lime card instead of a tinted+bordered one, the
 * eyebrow (phase + time window) merged into a single muted line, the
 * countdown blown up to the dominant element, and subLabel moved into a pill
 * on the same row instead of a small caption. Ceremony has no countdown (its
 * window is open-ended — see lib/schedule.ts), so that row and the progress
 * bar are simply omitted when there's nothing to count down.
 */
function BillboardIndicator({
  phaseLabel,
  subLabel,
  timeWindowText,
  nextLine,
  countdownText,
  progress,
}: Pick<PhaseIndicatorProps, "phaseLabel" | "subLabel" | "timeWindowText" | "nextLine" | "countdownText" | "progress">) {
  return (
    <div className="rounded-[28px] bg-mint-lime p-4">
      <div className="font-mint text-sm font-semibold text-mint-ink/70">
        {phaseLabel} · {timeWindowText}
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {countdownText ? (
          <span className="font-mint text-5xl font-bold leading-none tabular-nums text-mint-ink">{countdownText}</span>
        ) : null}
        <span className="flex-none whitespace-nowrap rounded-full bg-black/10 px-3.5 py-1.5 font-mint text-sm font-bold text-mint-ink">
          {subLabel}
        </span>
      </div>
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-mint-ink transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      ) : null}
      <div className="mt-3 text-sm font-medium text-mint-ink">{nextLine}</div>
    </div>
  );
}
