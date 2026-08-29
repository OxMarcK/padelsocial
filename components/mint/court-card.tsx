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
 * and a smaller "Poule · Ronde" line, no status pill — above the blue court.
 *
 * The court itself, per direct correction against the canvas:
 * - Real padel proportions (~2:1), not a short fixed height that flattens out
 *   into a letterbox strip on a wide card.
 * - A fully-opaque white court *outline*, inset from the blue card edge with
 *   visible blue margin around it (not edge-to-edge) — like a picture frame.
 * - Inner lines, from full to subtle: the net (100% white, full height,
 *   splits the court into a left and right square) → each of those 2 squares
 *   gets its own subtle vertical center line (4 rectangles left to right) →
 *   only the middle pair of rectangles (2 & 3 — the ones straddling the net)
 *   additionally gets a subtle horizontal center line, not the outer pair.
 */
export function CourtCard({ courtNumber, eyebrow, teamA, teamB, highlight, size = "sm", freePlay }: CourtCardProps) {
  const scoreSize = size === "lg" ? "text-5xl" : "text-4xl";

  return (
    <div className={`flex flex-col gap-4 rounded-[32px] bg-white p-5 shadow-[0_1px_3px_rgba(20,35,28,.08)] ${highlight ? "ring-2 ring-mint-lime" : ""}`}>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="font-mint text-2xl font-bold leading-none text-mint-ink">Baan {courtNumber}</span>
        {!freePlay && eyebrow ? <span className="truncate font-mint text-sm font-medium text-mint-lime-ink">{eyebrow}</span> : null}
      </div>
      <div className={`relative aspect-[2/1] w-full overflow-hidden rounded-[24px] ${freePlay ? "bg-mint-net/30" : "bg-glass-blue"}`}>
        {/* Court outline — fully opaque white, inset with a visible blue margin around it. */}
        <div className={`absolute inset-3 rounded-2xl border-2 border-white ${freePlay ? "opacity-40" : ""}`} />
        {/* Net — full height, 100% opaque, same strength as the outline. */}
        <div className={`absolute inset-y-3 left-1/2 w-[2px] -translate-x-1/2 bg-white ${freePlay ? "opacity-40" : ""}`} />
        {/* Each of the 2 squares the net makes gets its own subtle vertical center line. */}
        <div className={`absolute inset-y-3 left-1/4 w-[1.5px] -translate-x-1/2 bg-white/45 ${freePlay ? "opacity-40" : ""}`} />
        <div className={`absolute inset-y-3 left-3/4 w-[1.5px] -translate-x-1/2 bg-white/45 ${freePlay ? "opacity-40" : ""}`} />
        {/* Only the middle pair of rectangles (2 & 3, straddling the net) gets a subtle horizontal center line. */}
        <div className={`absolute left-1/4 right-1/4 top-1/2 h-[1.5px] -translate-y-1/2 bg-white/45 ${freePlay ? "opacity-40" : ""}`} />
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
