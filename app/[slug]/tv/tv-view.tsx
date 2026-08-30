"use client";

import { useEffect, useState } from "react";
import { LivePoll } from "@/components/live-poll";
import { Logo } from "@/components/logo";
import { CourtCard } from "@/components/mint/court-card";
import { Podium } from "@/components/mint/podium";
import { LiveCountdownText } from "@/components/mint/live-countdown";
import type { PhaseIndicatorData } from "@/lib/schedule";
import type { PouleStandingRow } from "@/lib/types";

interface TvCourt {
  n: number;
  eyebrow: string;
  aName: string;
  bName: string;
  aScore: number | null;
  bScore: number | null;
  freePlay?: boolean;
}

/** Design 6A trial: TV mode restyled for the light "mint" palette — same data/layout, no canvas reference for this screen so it extrapolates the established tokens/components. */
export function TvView({
  eventName,
  indicator,
  showCourts,
  courts,
  restingTeamNames,
  pouleStandings,
  showPodium,
  podium,
  tail,
}: {
  eventName: string;
  indicator: PhaseIndicatorData;
  showCourts: boolean;
  courts: TvCourt[];
  restingTeamNames: string[];
  pouleStandings: Array<{ label: string; rows: Array<PouleStandingRow & { name: string }> }>;
  showPodium: boolean;
  podium: Array<{ rank: 1 | 2 | 3; name: string }>;
  tail: Array<{ rank: number; name: string }>;
}) {
  const [view, setView] = useState<0 | 1>(0);

  useEffect(() => {
    if (!showCourts) return;
    const id = setInterval(() => setView((v) => (v === 0 ? 1 : 0)), 10_000);
    return () => clearInterval(id);
  }, [showCourts]);

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <LivePoll />
      <div className="flex items-center gap-7 bg-white px-16 py-8">
        <Logo variant="light" size="xl" />
        <div className="h-11 w-0.5 bg-mint-net/40" />
        <div>
          <div className="font-mint text-5xl font-bold leading-none text-mint-ink">{indicator.phaseLabel}</div>
          <div className="mt-1 text-xl text-mint-ink-muted">
            {indicator.timeWindowText} · {indicator.subLabel}
          </div>
        </div>
        {indicator.countdownText ? (
          <div className="ml-auto flex items-center gap-5">
            <span className="h-5 w-5 animate-pulse2 rounded-full bg-mint-lime" />
            <span className="font-mint text-4xl font-bold tracking-[0.1em] text-mint-lime-ink">Live</span>
            <span className="min-w-[270px] text-right font-mint text-8xl font-bold leading-none tabular-nums text-mint-ink">
              {indicator.countdownStartsAt && indicator.countdownEndsAt ? (
                <LiveCountdownText startsAtIso={indicator.countdownStartsAt} endsAtIso={indicator.countdownEndsAt} initialText={indicator.countdownText ?? ""} />
              ) : (
                indicator.countdownText
              )}
            </span>
          </div>
        ) : null}
      </div>

      <div className="px-16 py-12">
      <div className="pt-8">
        {showPodium ? (
          <div className="flex flex-col gap-10">
            <div className="font-mint text-5xl font-bold text-mint-lime-ink">
              {indicator.kind === "done" ? "Eindstand" : "Prijsuitreiking bij de bar"}
            </div>
            <div className="mx-auto w-full max-w-xl scale-125">
              <Podium entries={podium} />
            </div>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-1">
              {tail.map((row) => (
                <div key={row.rank} className="flex items-center gap-5 border-b border-mint-net/25 py-2.5 text-2xl text-mint-ink">
                  <span className="w-14 font-mint font-bold tabular-nums text-mint-ink-muted">{row.rank}</span>
                  <span className="flex-1">{row.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : !showCourts ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="font-mint text-6xl font-bold tracking-[0.2em] text-mint-lime-ink">Pauze</div>
            <div className="font-mint text-[10rem] font-bold leading-none tabular-nums text-mint-ink">
              {indicator.countdownStartsAt && indicator.countdownEndsAt ? (
                <LiveCountdownText startsAtIso={indicator.countdownStartsAt} endsAtIso={indicator.countdownEndsAt} initialText={indicator.countdownText ?? ""} />
              ) : (
                indicator.countdownText
              )}
            </div>
            <div className="font-mint text-3xl font-semibold text-mint-ink-muted">{indicator.nextLine}</div>
          </div>
        ) : view === 0 ? (
          <div className="flex flex-col gap-6">
            <div className="font-mint text-5xl font-bold text-mint-ink">Poulestanden</div>
            <div className="grid grid-cols-3 gap-9">
              {pouleStandings.map((poule) => (
                <div key={poule.label} className="flex flex-col gap-2 rounded-[28px] bg-white p-5 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
                  <div className="border-b-2 border-mint-net/30 pb-2 font-mint text-3xl font-bold tracking-[0.1em] text-mint-lime-ink">
                    Poule {poule.label}
                  </div>
                  {poule.rows.map((row, i) => (
                    <div key={row.teamId} className="flex items-center gap-3.5 rounded-xl px-3 py-3.5">
                      <span className={`w-9 font-mint text-3xl font-bold tabular-nums ${i === 0 ? "text-mint-lime-ink" : "text-mint-ink-muted"}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-xl font-semibold text-mint-ink">{row.name}</span>
                      <span className="font-mint text-4xl font-bold tabular-nums text-mint-ink">{row.points}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="font-mint text-5xl font-bold text-mint-ink">Nu op de baan</div>
            <div className="grid grid-cols-3 gap-6">
              {courts.map((c) =>
                c.freePlay ? (
                  <CourtCard key={c.n} courtNumber={c.n} size="lg" freePlay />
                ) : (
                  <CourtCard
                    key={c.n}
                    courtNumber={c.n}
                    eyebrow={c.eyebrow}
                    size="lg"
                    teamA={{ name: c.aName, score: c.aScore, winning: won(c.aScore, c.bScore) }}
                    teamB={{ name: c.bName, score: c.bScore, winning: won(c.bScore, c.aScore) }}
                  />
                )
              )}
              {restingTeamNames.length > 0 ? (
                <div className="flex flex-col gap-1 rounded-[28px] border-2 border-dashed border-mint-net/40 bg-white p-4">
                  <div className="text-sm text-mint-ink-muted">Rust deze ronde</div>
                  {restingTeamNames.map((name) => (
                    <div key={name} className="text-sm font-semibold text-mint-ink">
                      {name}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center gap-5 border-t-2 border-mint-net/30 pt-6">
        <span className="font-mint text-xl font-semibold tracking-[0.1em] text-mint-ink-muted">{eventName}</span>
        {showCourts ? (
          <div className="ml-auto flex gap-3">
            <span className={`h-2 w-14 rounded-full ${view === 0 ? "bg-mint-lime" : "bg-mint-net/40"}`} />
            <span className={`h-2 w-14 rounded-full ${view === 1 ? "bg-mint-lime" : "bg-mint-net/40"}`} />
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}

function won(a: number | null, b: number | null) {
  return a !== null && b !== null && a > b;
}
