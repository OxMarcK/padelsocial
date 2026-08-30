"use client";

import { useEffect, useState } from "react";

export type CountdownVariant = "billboard" | "split";
/** Billboard-only: which solid background it's sitting on, so text/pill/progress bar stay legible. */
export type CountdownTone = "lime" | "blue";

export interface LiveCountdownProps {
  variant: CountdownVariant;
  subLabel: string;
  startsAtIso: string;
  endsAtIso: string;
  /** Server-rendered values (from lib/schedule.ts's phaseIndicatorData) — used verbatim until the first client tick, so hydration matches exactly. */
  initialText: string;
  initialProgress: number;
  tone?: CountdownTone;
}

function fmtCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Ticks a countdown from `startsAtIso`/`endsAtIso` every second, starting
 * from `now = null` (meaning "not yet ticking — use the server's own
 * initialText/initialProgress verbatim") and only switching to a live
 * Date.now()-based computation once the first effect fires post-hydration.
 * Computing "now" eagerly on the client's first render (the more obvious
 * approach) reliably mismatches the server's render-time "now" by however
 * long the response took to reach the browser, throwing a React hydration
 * error on literally every load.
 */
function useTicking(startsAtIso: string, endsAtIso: string, initialText: string, initialProgress: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return { countdownText: initialText, pct: Math.round(Math.min(1, Math.max(0, initialProgress)) * 100) };

  const end = new Date(endsAtIso).getTime();
  const start = new Date(startsAtIso).getTime();
  const totalMs = end - start;
  const remainingMs = end - now;
  const progress = totalMs > 0 ? 1 - Math.max(0, remainingMs) / totalMs : 1;
  return { countdownText: fmtCountdown(remainingMs), pct: Math.round(Math.min(1, Math.max(0, progress)) * 100) };
}

/**
 * Just the ticking number, no wrapping markup — for places that already have
 * their own countdown styling (e.g. TV mode's two countdown spots) and only
 * need the text itself kept in sync every second.
 */
export function LiveCountdownText({
  startsAtIso,
  endsAtIso,
  initialText,
}: {
  startsAtIso: string;
  endsAtIso: string;
  initialText: string;
}) {
  const { countdownText } = useTicking(startsAtIso, endsAtIso, initialText, 0);
  return <>{countdownText}</>;
}

/**
 * Ticks the countdown number + progress bar locally every second, instead of
 * only updating on LivePoll's 20s refresh (components/live-poll.tsx) — that
 * cadence is fine for scores (which only change when an admin enters one),
 * but a countdown visibly frozen for up to 20s at a time then jumping reads
 * as broken. Re-syncs to the server's clock whenever the parent re-renders
 * (LivePoll refresh / navigation) since startsAtIso/endsAtIso come from
 * there — this component only fills in the seconds in between.
 */
export function LiveCountdown({
  variant,
  subLabel,
  startsAtIso,
  endsAtIso,
  initialText,
  initialProgress,
  tone = "lime",
}: LiveCountdownProps) {
  const { countdownText, pct } = useTicking(startsAtIso, endsAtIso, initialText, initialProgress);

  if (variant === "billboard") {
    const isBlue = tone === "blue";
    return (
      <>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span
            className={`font-mint text-5xl font-bold leading-none tabular-nums ${isBlue ? "text-white" : "text-mint-ink"}`}
          >
            {countdownText}
          </span>
          <span
            className={`flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 font-mint text-sm font-bold ${
              isBlue ? "bg-black/20 text-white" : "bg-black/10 text-mint-ink"
            }`}
          >
            {subLabel}
          </span>
        </div>
        <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${isBlue ? "bg-white/20" : "bg-black/10"}`}>
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${isBlue ? "bg-white" : "bg-mint-ink"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-mint text-5xl font-bold leading-none tabular-nums text-mint-ink">{countdownText}</span>
        <span className="text-base text-mint-ink-muted">{subLabel}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mint-net/20">
        <div className="h-full rounded-full bg-mint-lime transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>
    </>
  );
}
