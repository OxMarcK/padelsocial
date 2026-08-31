export interface ScoreStepperProps {
  teamName: string;
  score: number | null;
  onChange: (next: number) => void;
  accent?: boolean;
}

/** Design 6A trial: restyled for the light "mint" admin — see components/admin/score-entry.tsx. */
export function ScoreStepper({ teamName, score, onChange, accent }: ScoreStepperProps) {
  const current = score ?? 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="truncate text-sm font-semibold text-mint-ink">{teamName}</div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Minder games voor ${teamName}`}
          onClick={() => onChange(Math.max(0, current - 1))}
          className="h-16 w-16 rounded-2xl border border-mint-net/25 bg-mint-net/10 font-mint text-3xl font-bold text-mint-ink hover:bg-mint-net/20"
        >
          −
        </button>
        <div
          className={`flex-1 text-center font-mint text-6xl font-bold leading-none tabular-nums ${
            accent ? "text-mint-lime-ink" : "text-mint-ink"
          }`}
        >
          {score ?? "–"}
        </div>
        <button
          type="button"
          aria-label={`Meer games voor ${teamName}`}
          onClick={() => onChange(current + 1)}
          className="h-16 w-16 rounded-2xl border border-glass-blue bg-glass-blue font-mint text-3xl font-bold text-white hover:brightness-110"
        >
          +
        </button>
      </div>
    </div>
  );
}
