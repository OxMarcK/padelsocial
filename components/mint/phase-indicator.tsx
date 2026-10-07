import { LiveCountdown, type CountdownTone } from "./live-countdown";

export type PhaseKind = "pre" | "live" | "pauze" | "ceremony" | "done";

export interface PhaseIndicatorProps {
  phaseLabel: string;
  subLabel: string;
  timeWindowText: string;
  nextLine: string;
  kind: PhaseKind;
  countdownText?: string;
  progress?: number;
  /** ISO timestamps of the current window — when present, the countdown/progress bar tick locally every second via LiveCountdown instead of only updating on LivePoll's 20s refresh. */
  countdownStartsAt?: string;
  countdownEndsAt?: string;
}

/** Design 6A trial variant of components/phase-indicator.tsx, restyled for the light "mint" palette. */
export function PhaseIndicator({
  phaseLabel,
  subLabel,
  timeWindowText,
  nextLine,
  kind,
  countdownText,
  progress,
  countdownStartsAt,
  countdownEndsAt,
}: PhaseIndicatorProps) {
  if (kind === "pre" || kind === "pauze" || kind === "ceremony") {
    const tone = kind === "ceremony" ? "lime" : "ink";
    return (
      <BillboardIndicator {...{ phaseLabel, subLabel, timeWindowText, nextLine, countdownText, progress, countdownStartsAt, countdownEndsAt, tone }} />
    );
  }
  return (
    <SplitCardIndicator
      {...{ phaseLabel, subLabel, timeWindowText, nextLine, kind, countdownText, progress, countdownStartsAt, countdownEndsAt }}
    />
  );
}

/**
 * The "billboard" treatment for pre/pauze/ceremony (per the canvas
 * reference): a solid card instead of a tinted+bordered one, the eyebrow
 * (phase + time window) merged into a single muted line, the countdown
 * blown up to the dominant element, and subLabel moved into a pill on the
 * same row instead of a small caption. pre/pauze use the ink tone (white
 * text, lime accents, like the Agenda's tournament row); ceremony keeps the original lime tone. Ceremony also
 * has no countdown (its window is open-ended — see lib/schedule.ts), so
 * that row and the progress bar are simply omitted when there's nothing to
 * count down.
 */
function BillboardIndicator({
  phaseLabel,
  subLabel,
  timeWindowText,
  nextLine,
  countdownText,
  progress,
  countdownStartsAt,
  countdownEndsAt,
  tone,
}: Pick<
  PhaseIndicatorProps,
  "phaseLabel" | "subLabel" | "timeWindowText" | "nextLine" | "countdownText" | "progress" | "countdownStartsAt" | "countdownEndsAt"
> & { tone: CountdownTone }) {
  const isInk = tone === "ink";
  return (
    <div className={`rounded-[28px] p-4 ${isInk ? "bg-mint-ink shadow-[0_12px_28px_rgba(14,35,24,.18)]" : "bg-mint-lime shadow-card"}`}>
      <div className={`font-mint text-sm font-semibold ${isInk ? "text-mint-lime" : "text-mint-ink/70"}`}>
        {phaseLabel} · {timeWindowText}
      </div>
      {countdownText && countdownStartsAt && countdownEndsAt ? (
        <LiveCountdown
          variant="billboard"
          tone={tone}
          subLabel={subLabel}
          startsAtIso={countdownStartsAt}
          endsAtIso={countdownEndsAt}
          initialText={countdownText}
          initialProgress={progress ?? 0}
        />
      ) : (
        <div className="mt-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <span
            className={`flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 font-mint text-sm font-bold ${
              isInk ? "bg-white/15 text-white" : "bg-black/10 text-mint-ink"
            }`}
          >
            {subLabel}
          </span>
        </div>
      )}
      <div className={`mt-3 text-sm font-medium ${isInk ? "text-white/80" : "text-mint-ink"}`}>{nextLine}</div>
    </div>
  );
}

/**
 * The "split card" treatment for live/done (per the canvas reference): a
 * white top half (dot + phaseLabel + timeWindowText header, huge countdown
 * with subLabel riding alongside it, thin progress bar) sitting directly
 * above a solid dark-ink footer strip carrying nextLine behind a lime
 * "Straks" eyebrow. `done` has no countdown/progress (see
 * lib/schedule.ts's "finished" branch), so subLabel stands alone in that
 * row and the progress bar is omitted; its dot is muted and static instead
 * of the live pulsing lime one.
 */
function SplitCardIndicator({
  phaseLabel,
  subLabel,
  timeWindowText,
  nextLine,
  kind,
  countdownText,
  progress,
  countdownStartsAt,
  countdownEndsAt,
}: Pick<
  PhaseIndicatorProps,
  "phaseLabel" | "subLabel" | "timeWindowText" | "nextLine" | "kind" | "countdownText" | "progress" | "countdownStartsAt" | "countdownEndsAt"
>) {
  const isLive = kind === "live";
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-card">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 flex-none rounded-full ${isLive ? "bg-mint-lime animate-pulse2" : "bg-mint-net"}`} />
          <span className="font-mint text-lg font-extrabold tracking-tight text-mint-ink">{phaseLabel}</span>
          <span className="ml-auto text-sm font-medium text-mint-ink-muted">{timeWindowText}</span>
        </div>
        {countdownText && countdownStartsAt && countdownEndsAt ? (
          <LiveCountdown
            variant="split"
            subLabel={subLabel}
            startsAtIso={countdownStartsAt}
            endsAtIso={countdownEndsAt}
            initialText={countdownText}
            initialProgress={progress ?? 0}
          />
        ) : (
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mint text-lg font-bold text-mint-ink">{subLabel}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 bg-mint-ink px-4 py-3.5">
        <span className="font-mint text-sm font-bold text-mint-lime">Straks</span>
        <span className="text-sm font-medium text-white/90">{nextLine}</span>
      </div>
    </div>
  );
}
