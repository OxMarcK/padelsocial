export interface BracketMatchCardProps {
  label: string;
  courtNumber: number;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  note?: string;
}

export function BracketMatchCard({ label, courtNumber, teamAName, teamBName, scoreA, scoreB, note }: BracketMatchCardProps) {
  const aWins = scoreA !== null && scoreB !== null && scoreA > scoreB;
  const bWins = scoreA !== null && scoreB !== null && scoreB > scoreA;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-flood-white/10 bg-surface p-3.5">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-sm font-bold uppercase tracking-wider text-lime-serve">{label}</span>
        <span className="ml-auto font-display text-[13px] font-bold tracking-wider text-net-grey">Baan {courtNumber}</span>
      </div>
      <MatchRow name={teamAName} score={scoreA} winning={aWins} />
      <div className="h-px bg-net-grey/30" />
      <MatchRow name={teamBName} score={scoreB} winning={bWins} />
      {note ? <div className="text-xs text-ink-muted">{note}</div> : null}
    </div>
  );
}

function MatchRow({ name, score, winning }: { name: string; score: number | null; winning: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex-1 truncate text-sm ${winning ? "font-bold text-lime-serve" : "font-medium text-ink"}`}>{name}</span>
      <span className={`font-display text-2xl font-bold tabular-nums ${winning ? "text-lime-serve" : "text-ink-muted"}`}>
        {score ?? "–"}
      </span>
    </div>
  );
}
