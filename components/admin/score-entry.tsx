"use client";

import { useState, useTransition } from "react";
import { ScoreStepper } from "@/components/score-stepper";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/types";

export function ScoreEntry({
  match,
  teamAName,
  teamBName,
  onSave,
}: {
  match: Match;
  teamAName: string;
  teamBName: string;
  onSave: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}) {
  const [scoreA, setScoreA] = useState<number | null>(match.scoreA);
  const [scoreB, setScoreB] = useState<number | null>(match.scoreB);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const canSave = scoreA !== null && scoreB !== null && !!match.teamAId && !!match.teamBId;

  function save() {
    if (!canSave) return;
    startTransition(async () => {
      await onSave(match.id, scoreA!, scoreB!);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    });
  }

  if (!match.teamAId || !match.teamBId) {
    return <div className="text-sm text-ink-muted">Wachten op de vorige ronde…</div>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-flood-white/10 bg-surface p-4">
      <div className="font-display text-sm font-bold uppercase tracking-wider text-lime-serve">{match.label}</div>
      <ScoreStepper teamName={teamAName} score={scoreA} onChange={setScoreA} accent />
      <div className="h-px bg-net-grey/30" />
      <ScoreStepper teamName={teamBName} score={scoreB} onChange={setScoreB} />
      {!canSave ? <p className="text-xs text-ink-muted">Vul beide scores in.</p> : null}
      <Button onClick={save} disabled={!canSave || pending} fullWidth>
        {saved ? "Opgeslagen" : pending ? "Bezig…" : "Opslaan"}
      </Button>
    </div>
  );
}
