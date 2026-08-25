"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export interface TeamResultCardProps {
  teamName: string;
  finalRank: number;
  totalTeams: number;
  pouleLabel: string;
  pouleRank: number;
  wins: number;
  losses: number;
  summary: string;
  shareUrl: string;
}

export function TeamResultCard({ teamName, finalRank, totalTeams, pouleLabel, pouleRank, wins, losses, summary, shareUrl }: TeamResultCardProps) {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    const shareData = { title: `${teamName} — Padel Social`, text: summary, url: shareUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2600);
      }
    } catch {
      // user cancelled the native share sheet — no error state needed
    }
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-court-night p-4 text-flood-white">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold uppercase tracking-wider text-lime-serve">Jouw team</span>
      </div>
      <div className="font-display text-3xl font-bold leading-tight">{teamName}</div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Plek" value={finalRank} suffix={`/${totalTeams}`} />
        <Stat label={`Poule ${pouleLabel}`} value={pouleRank} suffix="e" />
        <Stat label="W–V" value={`${wins}–${losses}`} />
      </div>
      <div className="text-sm text-ink">{summary}</div>
      <Button onClick={handleShare} fullWidth>
        {shared ? "Link gekopieerd" : "Deel je kaart"}
      </Button>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-flood-white/[.07] p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="font-display text-3xl font-bold leading-tight">
        {value}
        {suffix ? <span className="text-sm text-ink-muted">{suffix}</span> : null}
      </div>
    </div>
  );
}
