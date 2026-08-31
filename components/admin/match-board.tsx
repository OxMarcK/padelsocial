"use client";

import { useState } from "react";
import { ScoreEntry } from "./score-entry";
import type { Match } from "@/lib/types";

export function MatchBoard({
  matches,
  teamNameById,
  onSave,
}: {
  matches: Match[];
  teamNameById: Record<string, string>;
  onSave: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}) {
  const sorted = [...matches].sort((a, b) => a.courtNumber - b.courtNumber);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id);
  const selected = sorted.find((m) => m.id === selectedId) ?? sorted[0];

  if (!selected) return <p className="text-sm text-mint-ink-muted">Geen wedstrijden in deze ronde.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {sorted.map((m) => {
          const done = m.scoreA !== null && m.scoreB !== null;
          const active = m.id === selected.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border ${
                active
                  ? "border-glass-blue bg-glass-blue text-white"
                  : done
                    ? "border-transparent bg-mint-lime/15 text-mint-lime-ink"
                    : "border-mint-net/20 bg-white text-mint-ink-muted"
              }`}
            >
              <span className="font-mint text-xl font-bold leading-none">{m.courtNumber}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider">{done ? "klaar" : "open"}</span>
            </button>
          );
        })}
      </div>
      <ScoreEntry
        key={selected.id}
        match={selected}
        teamAName={selected.teamAId ? teamNameById[selected.teamAId] ?? "?" : "?"}
        teamBName={selected.teamBId ? teamNameById[selected.teamBId] ?? "?" : "?"}
        onSave={onSave}
      />
    </div>
  );
}
