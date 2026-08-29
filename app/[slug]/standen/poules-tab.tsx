import { PouleTable } from "@/components/mint/poule-table";
import type { PouleStandingRow, Top8Resolution } from "@/lib/types";

export function PoulesTab({
  pouleStandings,
  teamNameById,
  top8,
}: {
  pouleStandings: Array<{ label: string; rows: PouleStandingRow[] }>;
  teamNameById: Record<string, string>;
  top8: Top8Resolution;
}) {
  const qualifiedIds = new Set(top8.seeds);

  return (
    <div className="flex flex-col gap-5">
      {pouleStandings.map((poule) => (
        <PouleTable
          key={poule.label}
          label={poule.label}
          rows={poule.rows.map((row) => ({
            ...row,
            name: teamNameById[row.teamId] ?? "?",
            qualifies: qualifiedIds.has(row.teamId),
          }))}
        />
      ))}
      <p className="text-xs text-mint-ink-muted">
        GV/GT = games voor en tegen. Bij gelijke punten beslist het saldo, dan games voor.
      </p>
    </div>
  );
}
