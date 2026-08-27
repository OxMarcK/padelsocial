"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export interface TeamResultCardProps {
  teamName: string;
  player1Name: string;
  player2Name: string;
  finalRank: number;
  totalTeams: number;
  pouleLabel: string;
  pouleRank: number;
  wins: number;
  losses: number;
  shareUrl: string;
}

/** Just the first name — players are entered as full names, the card only has room for a first-name pair. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function TeamResultCard({
  teamName,
  player1Name,
  player2Name,
  finalRank,
  totalTeams,
  pouleLabel,
  pouleRank,
  wins,
  losses,
  shareUrl,
}: TeamResultCardProps) {
  const [shared, setShared] = useState(false);
  const subtitle = `${firstName(player1Name)} & ${firstName(player2Name)} · ${pouleRank}e in poule ${pouleLabel}`;

  async function handleShare() {
    const shareData = { title: `${teamName} — Padel Social`, text: subtitle, url: shareUrl };
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
      <div>
        <div className="font-display text-3xl font-bold leading-tight">{teamName}</div>
        <div className="mt-0.5 text-sm text-ink-muted">{subtitle}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Plek" value={finalRank} suffix={`/${totalTeams}`} />
        <Stat label={`Poule ${pouleLabel}`} value={pouleRank} suffix="e" />
        <Stat label="W–V" value={`${wins}–${losses}`} />
      </div>
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
