import { BracketMatchCard } from "@/components/bracket-match-card";
import type { ResolvedBracketMatch } from "@/lib/bracket-engine";

const GROUPS: Array<{ title: string; ids: string[]; note: string }> = [
  { title: "Kwartfinales", ids: ["KF1", "KF2", "KF3", "KF4"], note: "Top 8 na de poulefase." },
  { title: "Halve finales & 5e-8e", ids: ["HF1", "HF2", "VR1", "VR2"], note: "Winnaars kwartfinales / verliezersronde." },
  { title: "Finales", ids: ["GRAND", "BRONZE", "PLACE_5_6", "PLACE_7_8"], note: "Beslist de eindstand 1 t/m 8." },
];

export function BracketTab({
  resolvedBracket,
  teamNameById,
}: {
  resolvedBracket: ResolvedBracketMatch[];
  teamNameById: Record<string, string>;
}) {
  const byId = new Map(resolvedBracket.map((m) => [m.id, m]));
  const name = (id: string | null) => (id ? teamNameById[id] ?? "?" : "TBD");

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">{group.title}</h2>
            <span className="text-xs text-ink-muted">{group.note}</span>
          </div>
          {group.ids.map((id) => {
            const m = byId.get(id);
            if (!m) return null;
            return (
              <BracketMatchCard
                key={id}
                label={m.label}
                courtNumber={m.court}
                teamAName={name(m.teamAId)}
                teamBName={name(m.teamBId)}
                scoreA={m.scoreA}
                scoreB={m.scoreB}
              />
            );
          })}
        </div>
      ))}
      <div className="rounded-2xl border border-dashed border-net-grey/60 p-3.5 text-xs text-ink">
        Plaatsingsgroep (7 teams) speelt op baan 5 door voor plek 9 en verder — zelfde tijden, eigen finale.
      </div>
    </div>
  );
}
