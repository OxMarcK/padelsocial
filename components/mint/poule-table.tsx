import type { PouleStandingRow } from "@/lib/types";

export interface PouleTableProps {
  label: string;
  rows: Array<PouleStandingRow & { name: string; qualifies?: boolean }>;
}

/**
 * Design 6A trial variant of components/poule-table.tsx, restyled for the
 * light "mint" palette. Per the canvas reference (screenshot check): the
 * title + "Punten" label live inside the same white card as the rows (not
 * above it), rank numbers sit in a circular badge (solid lime for a
 * qualifying row, pale lime otherwise), and qualifying rows are shown with a
 * lime-tinted row background instead of a separate "Naar KO" pill.
 */
export function PouleTable({ label, rows }: PouleTableProps) {
  return (
    <div className="flex flex-col gap-1 rounded-[28px] bg-white py-4 pl-4 pr-6 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-1">
        <span className="font-mint text-2xl font-bold text-mint-ink">Poule {label}</span>
        <span className="flex items-center gap-3">
          <span className="w-12 flex-none text-center font-mint text-sm font-medium text-mint-ink-muted">Saldo</span>
          <span className="w-14 flex-none text-center font-mint text-sm font-medium text-mint-ink-muted">Punten</span>
        </span>
      </div>
      {rows.map((row, i) => (
        <div key={row.teamId} className={`flex items-center gap-3 rounded-[28px] py-2.5 pl-[0.8rem] pr-2 ${row.qualifies ? "bg-mint-lime/25" : ""}`}>
          <span
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-mint text-lg font-bold tabular-nums ${
              row.qualifies ? "bg-mint-lime text-mint-lime-ink" : "bg-mint-lime/15 text-mint-ink-muted"
            }`}
          >
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-base font-semibold text-mint-ink">{row.name}</span>
            <span className="text-xs tabular-nums text-mint-ink-muted">
              {row.played} · {row.won}-{row.drawn}-{row.lost} · {row.gamesFor}:{row.gamesAgainst}
            </span>
          </span>
          <span className="w-12 flex-none text-center text-sm tabular-nums text-mint-ink-muted">
            {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
          </span>
          <span className="w-14 flex-none text-center font-mint text-2xl font-bold tabular-nums text-mint-ink">{row.points}</span>
        </div>
      ))}
    </div>
  );
}
