"use client";

import { useState } from "react";
import { FavoriteStarButton } from "./favorite-star";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

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

/** Team card on the team detail page — same Card/Heading/eyebrow treatment as the live event page. */
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
    <Card radius="lg" className="flex flex-col gap-4 p-5">
      <div>
        <Heading as="h2" size="display">{teamName}</Heading>
        <p className="mt-1 text-sm font-medium text-mint-ink-muted">{subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Plek" value={finalRank || "–"} suffix={finalRank ? `/${totalTeams}` : undefined} />
        <Stat label={`Poule ${pouleLabel}`} value={pouleRank} suffix="e" />
        <Stat label="W–V" value={`${wins}–${losses}`} />
      </div>
      <div className="flex gap-2">
        <FavoriteStarButton slug={slug} teamId={teamId} />
        <button
          onClick={handleShare}
          className="flex h-14 flex-1 items-center justify-center rounded-full bg-mint-lime font-mint text-lg font-bold text-mint-ink hover:brightness-105"
        >
          {shared ? "Link gekopieerd" : "Deel je kaart"}
        </button>
      </div>
    </Card>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-[14px] bg-mint-lime/15 px-3 py-2.5">
      <div className="text-xs font-bold text-mint-lime-ink">{label}</div>
      <div className="mt-0.5 font-mint text-3xl font-extrabold leading-tight tracking-tight tabular-nums text-mint-ink">
        {value}
        {suffix ? <span className="text-sm font-bold tracking-normal text-mint-ink-muted">{suffix}</span> : null}
      </div>
    </div>
  );
}
