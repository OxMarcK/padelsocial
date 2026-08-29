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
  const styles = KIND_STYLES[kind];
  return (
    <div className={`rounded-[28px] border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot} ${kind === "live" || kind === "pauze" ? "animate-pulse2" : ""}`} />
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
