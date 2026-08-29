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
 * Design 6A trial variant of components/court-card.tsx — same structure/logic,
 * restyled for the light "mint" palette. The court itself stays the same blue
 * rectangle with white lines (per the 6A spec: "glass-blue: baanvlak met witte
 * lijnen" — unchanged from the current dark theme), only the surrounding
 * chrome (eyebrow label, free-play placeholder) picks up the new tokens.
 */
export function CourtCard({ courtNumber, eyebrow, teamA, teamB, highlight, size = "sm", freePlay }: CourtCardProps) {
  const height = size === "lg" ? "h-[150px]" : "h-28";
  const scoreSize = size === "lg" ? "text-5xl" : "text-4xl";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-mint text-sm font-bold text-mint-ink-muted">{freePlay ? "Vrij te spelen" : eyebrow}</div>
      <div
        className={`relative ${height} overflow-hidden rounded-[28px] ${freePlay ? "bg-mint-net/30" : "bg-glass-blue"} shadow-[inset_0_0_0_3px_rgba(255,255,255,.55)] ${
          highlight ? "ring-2 ring-mint-lime" : ""
        }`}
      >
        <div className={`absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/90 ${freePlay ? "opacity-30" : ""}`} />
        <div className={`absolute inset-y-0 left-[22%] w-[2px] bg-white/40 ${freePlay ? "opacity-30" : ""}`} />
        <div className={`absolute inset-y-0 left-[78%] w-[2px] bg-white/40 ${freePlay ? "opacity-30" : ""}`} />
        <div className={`absolute left-0 top-1/2 h-[2px] w-[22%] bg-white/40 ${freePlay ? "opacity-30" : ""}`} />
        <div className={`absolute right-0 top-1/2 h-[2px] w-[22%] bg-white/40 ${freePlay ? "opacity-30" : ""}`} />
        <div className="absolute left-1/2 top-0 w-[24%] -translate-x-1/2 rounded-b-[8px] bg-white py-1 text-center font-mint text-sm font-bold text-mint-ink">
          Baan {courtNumber}
        </div>
        {freePlay ? null : (
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
