import type { PouleStandingRow } from "@/lib/types";

export interface PouleTableProps {
  label: string;
  rows: Array<PouleStandingRow & { name: string; qualifies?: boolean }>;
}

/** Design 6A trial variant of components/poule-table.tsx, restyled for the light "mint" palette. */
export function PouleTable({ label, rows }: PouleTableProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mint text-xl font-bold text-mint-ink">Poule {label}</span>
        <span className="font-mint text-[11px] font-bold tracking-wider text-mint-ink-muted">G · W-GL-V · GV:GT · PTN</span>
      </div>
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)]">
        {rows.map((row, i) => (
          <div
            key={row.teamId}
            className={`flex items-center gap-2.5 border-b border-mint-net/15 px-3 py-2.5 last:border-b-0 ${
              row.qualifies ? "border-l-[3px] border-l-mint-lime" : ""
            }`}
          >
            <span className={`w-[18px] font-mint text-xl font-bold tabular-nums ${i === 0 ? "text-mint-lime-ink" : "text-mint-ink-muted"}`}>
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-mint-ink">{row.name}</span>
                {row.qualifies ? (
                  <span className="inline-flex items-center rounded-full bg-mint-lime px-1.5 py-0.5 font-mint text-[10px] font-bold text-mint-lime-ink">
                    Naar KO
                  </span>
                ) : null}
              </span>
              <span className="text-xs tabular-nums text-mint-ink-muted">
                {row.played} · {row.won}-{row.drawn}-{row.lost} · {row.gamesFor}:{row.gamesAgainst} ({row.saldo > 0 ? "+" : ""}
                {row.saldo})
              </span>
            </span>
            <span className={`font-mint text-2xl font-bold tabular-nums ${row.qualifies ? "text-mint-lime-ink" : "text-mint-ink"}`}>
              {row.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
