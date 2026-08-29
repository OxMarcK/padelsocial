"use client";

import { useEffect, useState } from "react";

export type CountdownVariant = "billboard" | "split";

export interface LiveCountdownProps {
  variant: CountdownVariant;
  subLabel: string;
  startsAtIso: string;
  endsAtIso: string;
}

function fmtCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Just the ticking number, no wrapping markup — for places that already have
 * their own countdown styling (e.g. TV mode's two countdown spots) and only
 * need the text itself kept in sync every second.
 */
export function LiveCountdownText({ startsAtIso, endsAtIso }: { startsAtIso: string; endsAtIso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{fmtCountdown(new Date(endsAtIso).getTime() - now)}</>;
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
export function LiveCountdown({ variant, subLabel, startsAtIso, endsAtIso }: LiveCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const end = new Date(endsAtIso).getTime();
  const start = new Date(startsAtIso).getTime();
  const totalMs = end - start;
  const remainingMs = end - now;
  const progress = totalMs > 0 ? 1 - Math.max(0, remainingMs) / totalMs : 1;
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const countdownText = fmtCountdown(remainingMs);

  if (variant === "billboard") {
    return (
      <>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="font-mint text-5xl font-bold leading-none tabular-nums text-mint-ink">{countdownText}</span>
          <span className="flex-none whitespace-nowrap rounded-full bg-black/10 px-3.5 py-1.5 font-mint text-sm font-bold text-mint-ink">
            {subLabel}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-mint-ink transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
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
