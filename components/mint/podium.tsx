export interface PodiumEntry {
  rank: 1 | 2 | 3;
  name: string;
  note?: string;
}

const HEIGHTS: Record<1 | 2 | 3, string> = { 1: "h-40", 2: "h-32", 3: "h-28" };
const COLORS: Record<1 | 2 | 3, string> = {
  1: "bg-mint-lime text-mint-lime-ink",
  2: "bg-glass-blue text-white",
  3: "bg-clay-orange text-white",
};
const TEXT_SIZE: Record<1 | 2 | 3, string> = { 1: "text-5xl", 2: "text-4xl", 3: "text-[34px]" };

/**
 * Design 6A trial variant of components/podium.tsx — restyled per the
 * updated canvas reference: the whole podium now sits on its own white
 * card, and each rank block is fully rounded instead of just rounded on
 * top. Block colors are unchanged (lime/blue/orange for 1/2/3) per the
 * request to keep those intact. `caption` renders as a divided-off line
 * at the bottom of the same card (e.g. "Prijsuitreiking om 13:45"),
 * replacing what used to be a separate paragraph next to the podium.
 */
export function Podium({ entries, caption }: { entries: PodiumEntry[]; caption?: string }) {
  const order: Array<1 | 2 | 3> = [2, 1, 3];
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <div className="flex flex-col gap-5 rounded-[28px] bg-white p-5 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div className="grid grid-cols-3 items-end gap-3">
        {order.map((rank) => {
          const entry = byRank.get(rank);
          if (!entry) return <div key={rank} />;
          return (
            <div key={rank} className="flex flex-col items-center gap-2">
              {rank === 1 ? (
                <div className="rounded-full bg-mint-lime px-2.5 py-1 font-mint text-xs font-bold text-mint-lime-ink">KAMPIOEN</div>
              ) : null}
              <div className={`text-center text-sm leading-tight text-mint-ink ${rank === 1 ? "font-bold" : "font-semibold"}`}>
                {entry.name}
              </div>
              <div className={`flex w-full flex-col items-center justify-center gap-1 rounded-[24px] ${HEIGHTS[rank]} ${COLORS[rank]}`}>
                <span className={`font-mint font-bold leading-none ${TEXT_SIZE[rank]}`}>{rank}</span>
                {entry.note ? <span className="text-[11px] font-semibold">{entry.note}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
      {caption ? <div className="border-t border-mint-net/15 pt-4 text-center text-sm text-mint-ink-muted">{caption}</div> : null}
    </div>
  );
}
