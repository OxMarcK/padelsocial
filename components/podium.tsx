export interface PodiumEntry {
  rank: 1 | 2 | 3;
  name: string;
  note?: string;
}

const HEIGHTS: Record<1 | 2 | 3, string> = { 1: "h-32", 2: "h-24", 3: "h-[72px]" };
const COLORS: Record<1 | 2 | 3, string> = {
  1: "bg-lime-serve text-court-night",
  2: "bg-glass-blue text-flood-white",
  3: "bg-clay-orange text-court-night",
};
const TEXT_SIZE: Record<1 | 2 | 3, string> = { 1: "text-5xl", 2: "text-4xl", 3: "text-[34px]" };

export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const order: Array<1 | 2 | 3> = [2, 1, 3];
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <div className="grid grid-cols-3 items-end gap-2">
      {order.map((rank) => {
        const entry = byRank.get(rank);
        if (!entry) return <div key={rank} />;
        return (
          <div key={rank} className="flex flex-col items-center gap-2">
            {rank === 1 ? (
              <div className="rounded bg-lime-serve px-2 py-0.5 font-display text-xs font-bold tracking-wider text-court-night">
                KAMPIOEN
              </div>
            ) : null}
            <div className={`text-center text-sm leading-tight ${rank === 1 ? "font-bold" : "font-semibold"}`}>{entry.name}</div>
            <div className={`flex w-full flex-col items-center justify-center gap-1 rounded-t-xl ${HEIGHTS[rank]} ${COLORS[rank]}`}>
              <span className={`font-display font-bold leading-none ${TEXT_SIZE[rank]}`}>{rank}</span>
              {entry.note ? <span className="text-[11px] font-semibold">{entry.note}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
