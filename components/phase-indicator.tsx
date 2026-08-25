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
  pre: { bg: "bg-glass-blue/15", border: "border-glass-blue", dot: "bg-glass-blue" },
  live: { bg: "bg-surface", border: "border-flood-white/10", dot: "bg-lime-serve" },
  pauze: { bg: "bg-lime-serve/10", border: "border-lime-serve", dot: "bg-lime-serve" },
  ceremony: { bg: "bg-clay-orange/10", border: "border-clay-orange", dot: "bg-clay-orange" },
  done: { bg: "bg-surface", border: "border-flood-white/10", dot: "bg-net-grey" },
};

export function PhaseIndicator({ phaseLabel, subLabel, timeWindowText, nextLine, kind, countdownText, progress }: PhaseIndicatorProps) {
  const styles = KIND_STYLES[kind];
  return (
    <div className={`rounded-2xl border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot} ${kind === "live" || kind === "pauze" ? "animate-pulse2" : ""}`} />
        <span className="font-display text-lg font-bold uppercase tracking-wider text-lime-serve">{phaseLabel}</span>
        {countdownText ? (
          <span className="ml-auto font-display text-4xl font-bold leading-none tabular-nums">{countdownText}</span>
        ) : null}
      </div>
      {typeof progress === "number" ? (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-net-grey/35">
          <div
            className="h-full rounded-full bg-lime-serve transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      ) : null}
      <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        <span>{subLabel}</span>
        <span>{timeWindowText}</span>
      </div>
      <div className="mt-2.5 border-t border-net-grey/30 pt-2.5 text-sm text-flood-white">{nextLine}</div>
    </div>
  );
}
