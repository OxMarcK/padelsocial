export interface BracketMatchCardProps {
  label: string;
  courtNumber: number;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  note?: string;
}

/** Design 6A trial variant of components/bracket-match-card.tsx, restyled for the light "mint" palette. */
export function BracketMatchCard({ label, courtNumber, teamAName, teamBName, scoreA, scoreB, note }: BracketMatchCardProps) {
  const aWins = scoreA !== null && scoreB !== null && scoreA > scoreB;
  const bWins = scoreA !== null && scoreB !== null && scoreB > scoreA;

  return (
    <div className="flex flex-col gap-2 rounded-[24px] bg-white py-3.5 pl-3.5 pr-5 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div className="flex items-baseline gap-2">
        <span className="font-mint text-sm font-bold text-mint-lime-ink">{label}</span>
        <span className="ml-auto font-mint text-[13px] font-bold tracking-wider text-mint-ink-muted">Baan {courtNumber}</span>
      </div>
      <MatchRow name={teamAName} score={scoreA} winning={aWins} />
      <div className="h-px bg-mint-net/20" />
      <MatchRow name={teamBName} score={scoreB} winning={bWins} />
      {note ? <div className="text-xs text-mint-ink-muted">{note}</div> : null}
    </div>
  );
}

function MatchRow({ name, score, winning }: { name: string; score: number | null; winning: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex-1 truncate text-sm ${winning ? "font-bold text-mint-lime-ink" : "font-medium text-mint-ink"}`}>{name}</span>
      <span className={`font-mint text-2xl font-bold tabular-nums ${winning ? "text-mint-lime-ink" : "text-mint-ink-muted"}`}>
        {score ?? "–"}
      </span>
    </div>
  );
}
