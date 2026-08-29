import { BracketMatchCard } from "@/components/mint/bracket-match-card";
import type { ResolvedBracketMatch } from "@/lib/bracket-engine";

const GROUPS: Array<{ title: string; ids: string[]; note: string }> = [
  { title: "Kwartfinales", ids: ["KF1", "KF2", "KF3", "KF4"], note: "Top 8 na de poulefase." },
  { title: "Halve finales", ids: ["HF1", "HF2"], note: "Winnaars kwartfinales." },
  { title: "Finales", ids: ["GRAND", "BRONZE"], note: "Beslist plek 1 t/m 4." },
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
            <h2 className="font-mint text-2xl font-bold text-mint-ink">{group.title}</h2>
            <span className="text-xs text-mint-ink-muted">{group.note}</span>
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
      <div className="rounded-[24px] border border-dashed border-mint-net/50 p-3.5 text-xs text-mint-ink">
        Overige banen zijn vrij te spelen. Plek 5 t/m 8 wordt bepaald door de seeding van het verliezende team, plek
        9 en verder door de poulestand.
      </div>
    </div>
  );
}
