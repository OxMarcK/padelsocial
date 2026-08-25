export interface ScoreStepperProps {
  teamName: string;
  score: number | null;
  onChange: (next: number) => void;
  accent?: boolean;
}

export function ScoreStepper({ teamName, score, onChange, accent }: ScoreStepperProps) {
  const current = score ?? 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="truncate text-sm font-semibold">{teamName}</div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Minder games voor ${teamName}`}
          onClick={() => onChange(Math.max(0, current - 1))}
          className="h-16 w-16 rounded-2xl border border-flood-white/15 bg-flood-white/[.08] font-display text-3xl font-bold hover:bg-flood-white/[.16]"
        >
          −
        </button>
        <div
          className={`flex-1 text-center font-display text-6xl font-bold leading-none tabular-nums ${
            accent ? "text-lime-serve" : "text-flood-white"
          }`}
        >
          {score ?? "–"}
        </div>
        <button
          type="button"
          aria-label={`Meer games voor ${teamName}`}
          onClick={() => onChange(current + 1)}
          className="h-16 w-16 rounded-2xl border border-glass-blue bg-glass-blue font-display text-3xl font-bold text-flood-white hover:brightness-110"
        >
          +
        </button>
      </div>
    </div>
  );
}
