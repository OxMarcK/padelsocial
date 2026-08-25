import type { PouleStandingRow } from "@/lib/types";
import { Chip } from "./ui/chip";

export interface PouleTableProps {
  label: string;
  rows: Array<PouleStandingRow & { name: string; qualifies?: boolean }>;
}

export function PouleTable({ label, rows }: PouleTableProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-xl font-bold uppercase tracking-wider">Poule {label}</span>
        <span className="font-display text-[11px] font-bold tracking-wider text-net-grey">G · W-GL-V · GV:GT · PTN</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-flood-white/10 bg-surface">
        {rows.map((row, i) => (
          <div
            key={row.teamId}
            className={`flex items-center gap-2.5 border-b border-net-grey/20 px-3 py-2.5 last:border-b-0 ${
              row.qualifies ? "border-l-[3px] border-l-lime-serve" : ""
            }`}
          >
            <span className={`w-[18px] font-display text-xl font-bold tabular-nums ${i === 0 ? "text-lime-serve" : "text-ink-muted"}`}>
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold">{row.name}</span>
                {row.qualifies ? <Chip tone="lime">NAAR KO</Chip> : null}
              </span>
              <span className="text-xs tabular-nums text-ink-muted">
                {row.played} · {row.won}-{row.drawn}-{row.lost} · {row.gamesFor}:{row.gamesAgainst} ({row.saldo > 0 ? "+" : ""}
                {row.saldo})
              </span>
            </span>
            <span className={`font-display text-2xl font-bold tabular-nums ${row.qualifies ? "text-lime-serve" : "text-flood-white"}`}>
              {row.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
