/** Explainer card for the public aanmeldpagina — how the promotion/relegation
 * ladder works. The court-promotion mechanic (winners up, losers down) is the
 * same for every weekly format, but the partner chip isn't: Up & Down swaps
 * partners every round, King of the Court keeps the same duo all session —
 * same title-based format detection app/page.tsx's sessionActionLabel
 * already uses for signup-button copy. The "hoogste baan" callout takes
 * highestCourtNumber as a prop rather than hardcoding it,
 * since a session's baannummers are no longer assumed to be 1..N (see
 * session-types.ts). */
export function GoodToKnow({ title, highestCourtNumber }: { title: string; highestCourtNumber: number }) {
  const fixedPartner = title.includes("King of the Court");
  return (
    <div className="rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(14,35,24,.06)]">
      <h3 className="font-mint text-lg font-bold text-[#0E2318]">Goed om te weten</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-glass-blue/10 px-4 py-2 font-mint text-sm font-bold text-glass-blue">
          Elke ronde · 20 min
        </span>
        <span className="rounded-full bg-mint-lime/40 px-4 py-2 font-mint text-sm font-bold text-mint-lime-ink">
          {fixedPartner ? "Vaste partner" : "Wisselende partner"}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3 border-t border-mint-net/15 pt-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-mint-lime/40 text-mint-lime-ink">
          ↑
        </span>
        <p className="text-sm text-mint-ink-muted">
          Winnaars schuiven een baan omhoog, verliezers omlaag. Baan {highestCourtNumber} is de hoogste.
        </p>
      </div>
    </div>
  );
}
