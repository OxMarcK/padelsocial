export interface CourtCardTeam {
  name: string;
  score: number | null;
  winning: boolean;
}

export interface CourtCardProps {
  courtNumber: number;
  eyebrow: string;
  teamA: CourtCardTeam;
  teamB: CourtCardTeam;
  highlight?: boolean;
  size?: "sm" | "lg";
}

/** The signature illustrative device: a padel court rendered as a rounded blue rectangle with a center line. */
export function CourtCard({ courtNumber, eyebrow, teamA, teamB, highlight, size = "sm" }: CourtCardProps) {
  const height = size === "lg" ? "h-[150px]" : "h-28";
  const scoreSize = size === "lg" ? "text-5xl" : "text-4xl";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-display text-sm font-bold uppercase tracking-wider text-lime-serve">{eyebrow}</div>
      <div
        className={`relative ${height} overflow-hidden rounded-2xl bg-glass-blue shadow-[inset_0_0_0_3px_rgba(245,247,250,.55)] ${
          highlight ? "ring-2 ring-lime-serve" : ""
        }`}
      >
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-flood-white/90" />
        <div className="absolute inset-y-0 left-[22%] w-[2px] bg-flood-white/40" />
        <div className="absolute inset-y-0 left-[78%] w-[2px] bg-flood-white/40" />
        <div className="absolute left-0 top-1/2 h-[2px] w-[22%] bg-flood-white/40" />
        <div className="absolute right-0 top-1/2 h-[2px] w-[22%] bg-flood-white/40" />
        <div className="absolute left-1/2 top-0 w-[24%] -translate-x-1/2 rounded-b-[5px] bg-flood-white py-1 text-center font-display text-sm font-bold uppercase tracking-wider text-court-night">
          Baan {courtNumber}
        </div>
        <div className="absolute inset-0 grid grid-cols-2">
          {[teamA, teamB].map((team, i) => (
            <div key={i} className="flex flex-col-reverse items-center justify-center gap-1 px-2">
              <div className="text-center text-[13px] font-semibold leading-tight [text-shadow:0_1px_4px_rgba(14,20,32,.45)]">
                {team.name}
              </div>
              <div
                className={`font-display font-bold leading-none tabular-nums ${scoreSize} ${
                  team.winning ? "text-lime-serve" : "text-flood-white"
                }`}
              >
                {team.score ?? "–"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
