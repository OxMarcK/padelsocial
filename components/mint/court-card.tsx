export interface CourtCardTeam {
  name: string;
  score: number | null;
  winning: boolean;
}

export interface CourtCardProps {
  courtNumber: number;
  eyebrow?: string;
  teamA?: CourtCardTeam;
  teamB?: CourtCardTeam;
  highlight?: boolean;
  size?: "sm" | "lg";
  freePlay?: boolean;
}

/**
 * Design 6A trial variant of components/court-card.tsx — restyled for the light
 * "mint" palette. Per the canvas reference: each match is its own white rounded
 * card (not bare on the section background) with a header row — big "Baan N"
 * and a smaller "Poule · Ronde" line, no status pill — above the blue court
 * rectangle. The court lines are a plain "+": one full-height net line and one
 * full-width line crossing it, splitting the court into 4 equal quadrants
 * (simpler than the dark theme's service-line marks).
 */
export function CourtCard({ courtNumber, eyebrow, teamA, teamB, highlight, size = "sm", freePlay }: CourtCardProps) {
  const height = size === "lg" ? "h-[150px]" : "h-28";
  const scoreSize = size === "lg" ? "text-5xl" : "text-4xl";

  return (
    <div className={`flex flex-col gap-4 rounded-[32px] bg-white p-5 shadow-[0_1px_3px_rgba(20,35,28,.08)] ${highlight ? "ring-2 ring-mint-lime" : ""}`}>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-mint text-2xl font-bold leading-none text-mint-ink">Baan {courtNumber}</span>
        {!freePlay && eyebrow ? <span className="truncate font-mint text-sm font-medium text-mint-lime-ink">{eyebrow}</span> : null}
      </div>
      <div className={`relative ${height} overflow-hidden rounded-[24px] ${freePlay ? "bg-mint-net/30" : "bg-glass-blue"} shadow-[inset_0_0_0_3px_rgba(255,255,255,.55)]`}>
        <div className={`absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/90 ${freePlay ? "opacity-30" : ""}`} />
        <div className={`absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-white/90 ${freePlay ? "opacity-30" : ""}`} />
        {freePlay ? (
          <div className="absolute inset-0 flex items-center justify-center font-mint text-sm font-bold text-mint-ink-muted">
            Vrij te spelen
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-2">
            {[teamA!, teamB!].map((team, i) => (
              <div key={i} className="flex flex-col-reverse items-center justify-center gap-1 px-2">
                <div className="text-center text-[13px] font-semibold leading-tight text-white [text-shadow:0_1px_4px_rgba(14,20,32,.45)]">
                  {team.name}
                </div>
                <div
                  className={`font-mint font-bold leading-none tabular-nums ${scoreSize} ${
                    team.winning ? "text-mint-lime" : "text-white"
                  }`}
                >
                  {team.score ?? "–"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
