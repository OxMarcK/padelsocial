/** Explainer card for the public aanmeldpagina — how the weekly "wisselend"
 * format works. Mostly static copy (every weekly session follows the same
 * format), except the "hoogste baan" callout: since a session's baannummers
 * are no longer assumed to be 1..N (see session-types.ts), the highest
 * baannummer of *this* session has to be passed in rather than hardcoded. */
export function GoodToKnow({ highestCourtNumber }: { highestCourtNumber: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <h3 className="font-mint text-lg font-bold text-[#0E2318]">Goed om te weten</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-glass-blue/10 px-4 py-2 font-mint text-sm font-bold text-glass-blue">
          Elke ronde · 20 min
        </span>
        <span className="rounded-full bg-mint-lime/40 px-4 py-2 font-mint text-sm font-bold text-mint-lime-ink">
          Wisselende partner
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3 border-t border-mint-net/15 pt-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-mint-lime/40 text-mint-lime-ink">
          ↑
        </span>
        <p className="text-sm text-mint-ink">
          Winnaars schuiven een baan omhoog, verliezers omlaag. Baan {highestCourtNumber} is de hoogste.
        </p>
      </div>
    </div>
  );
}
