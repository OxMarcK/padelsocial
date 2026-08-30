"use client";

import { useState } from "react";
import { FavoriteStarButton } from "./favorite-star";

export interface TeamResultCardProps {
  slug: string;
  teamId: string;
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

/** Design 6A trial variant of components/team-result-card.tsx, restyled for the light "mint" palette. */
export function TeamResultCard({
  slug,
  teamId,
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
    <div className="flex flex-col gap-3.5 rounded-[28px] bg-white p-4 text-mint-ink shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div>
        <div className="font-mint text-3xl font-bold leading-tight text-mint-ink">{teamName}</div>
        <div className="mt-0.5 text-sm text-mint-ink-muted">{subtitle}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Plek" value={finalRank} suffix={`/${totalTeams}`} />
        <Stat label={`Poule ${pouleLabel}`} value={pouleRank} suffix="e" />
        <Stat label="W–V" value={`${wins}–${losses}`} />
      </div>
      <div className="flex gap-2">
        <FavoriteStarButton slug={slug} teamId={teamId} />
        <button
          onClick={handleShare}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-mint-lime font-mint text-lg font-bold text-mint-lime-ink hover:brightness-105"
        >
          {shared ? "Link gekopieerd" : "Deel je kaart"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-mint-net/10 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-mint-ink-muted">{label}</div>
      <div className="font-mint text-3xl font-bold leading-tight text-mint-ink">
        {value}
        {suffix ? <span className="text-sm text-mint-ink-muted">{suffix}</span> : null}
      </div>
    </div>
  );
}
