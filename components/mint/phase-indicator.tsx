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
    const tone = kind === "ceremony" ? "lime" : "blue";
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
 * same row instead of a small caption. pre/pauze use the blue tone (white
 * text, dark pill); ceremony keeps the original lime tone. Ceremony also
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
  const isBlue = tone === "blue";
  return (
    <div className={`rounded-[28px] p-4 ${isBlue ? "bg-glass-blue" : "bg-mint-lime"}`}>
      <div className={`font-mint text-sm font-semibold ${isBlue ? "text-white/70" : "text-mint-ink/70"}`}>
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
              isBlue ? "bg-black/20 text-white" : "bg-black/10 text-mint-ink"
            }`}
          >
            {subLabel}
          </span>
        </div>
      )}
      <div className={`mt-3 text-sm font-medium ${isBlue ? "text-white" : "text-mint-ink"}`}>{nextLine}</div>
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
    <div className="overflow-hidden rounded-[28px] bg-white">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 flex-none rounded-full ${isLive ? "bg-mint-lime animate-pulse2" : "bg-mint-net"}`} />
          <span className="font-mint text-lg font-bold text-mint-ink">{phaseLabel}</span>
          <span className="ml-auto text-sm text-mint-ink-muted">{timeWindowText}</span>
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
        <span className="text-sm text-white/90">{nextLine}</span>
      </div>
    </div>
  );
}
