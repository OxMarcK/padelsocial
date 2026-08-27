import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { computeSchedule, pouleRoundWindow, fmtTime } from "@/lib/schedule";
import { PHASE_META } from "@/lib/phases";
import { BRACKET_DEFINITION, type TeamSource } from "@/lib/bracket-engine";
import { Logo } from "@/components/logo";

/** The bracket hasn't been played yet at this point, so a slot can only ever describe the *rule* that decides it. */
function describeSource(source: TeamSource): string {
  if (source.type === "seed") return `Seed ${source.index + 1}`;
  if (source.type === "winnerOf") return `Winnaar ${source.matchId}`;
  return `Verliezer ${source.matchId}`;
}

const KNOCKOUT_GROUPS: Array<{ title: string; round: 1 | 2 | 3; ids: string[] }> = [
  { title: "Kwartfinales", round: 1, ids: ["KF1", "KF2", "KF3", "KF4"] },
  { title: "Halve finales", round: 2, ids: ["HF1", "HF2"] },
  { title: "Finales", round: 3, ids: ["GRAND", "BRONZE"] },
];

export default async function SchemaPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules] = await Promise.all([repo.listTeams(event.id), repo.listPoules(event.id)]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const windows = computeSchedule(event, schedule.roundsCount || 1);
  const pouleStartsAt = windows.find((w) => w.status === "poulefase")!.startsAt;
  const courtNumbers = Array.from({ length: event.courts }, (_, i) => i + 1);
  const bracketDefById = Object.fromEntries(BRACKET_DEFINITION.map((d) => [d.id, d]));

  return (
    <main className="min-h-screen bg-court-night px-16 py-12 text-flood-white">
      <header className="flex items-center gap-7 border-b-2 border-net-grey/35 pb-6">
        <Logo size="xl" />
        <div className="h-11 w-0.5 bg-net-grey" />
        <div>
          <div className="font-display text-5xl font-bold uppercase leading-none tracking-wide">{event.name}</div>
          <div className="mt-1.5 text-xl text-ink-muted">
            {event.date} · {event.startTime} · {event.location}
          </div>
        </div>
      </header>

      <section className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Dagindeling</h2>
        <div className="flex overflow-x-auto rounded-2xl border border-flood-white/10 bg-surface">
          {windows.map((w) => (
            <div key={w.status} className="min-w-[170px] flex-1 border-r border-flood-white/10 px-5 py-4 last:border-r-0">
              <div className="font-display text-base font-bold uppercase tracking-wide">{PHASE_META[w.status].label}</div>
              <div className="mt-1 text-sm tabular-nums text-ink-muted">
                {fmtTime(w.startsAt)}
                {w.endsAt ? `–${fmtTime(w.endsAt)}` : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {schedule.roundsCount > 0 ? (
        <section className="mt-10 flex flex-col gap-4">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Poulefase</h2>
          <div className="overflow-x-auto rounded-2xl border border-flood-white/10">
            <table className="w-full min-w-[900px] border-collapse bg-surface">
              <thead>
                <tr>
                  <th className="w-40 border-b border-flood-white/10 bg-surface-alt px-4 py-3 text-left font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
                    Ronde
                  </th>
                  {courtNumbers.map((c) => (
                    <th
                      key={c}
                      className="border-b border-flood-white/10 bg-surface-alt px-3 py-3 text-center font-display text-sm font-bold uppercase tracking-wide text-ink-muted"
                    >
                      Baan {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: schedule.roundsCount }, (_, i) => i + 1).map((round) => {
                  const { startsAt, endsAt } = pouleRoundWindow(pouleStartsAt, round);
                  const byCourt = Object.fromEntries(schedule.matches.filter((m) => m.round === round).map((m) => [m.court, m]));
                  return (
                    <tr key={round} className="border-b border-flood-white/8 last:border-b-0">
                      <td className="px-4 py-2.5 align-middle">
                        <div className="font-display text-lg font-bold">Ronde {round}</div>
                        <div className="text-xs tabular-nums text-ink-muted">
                          {fmtTime(startsAt)}–{fmtTime(endsAt)}
                        </div>
                      </td>
                      {courtNumbers.map((court) => {
                        const m = byCourt[court];
                        return (
                          <td key={court} className="p-1.5 align-middle">
                            {m ? (
                              <div className="rounded-xl border border-glass-blue/50 bg-glass-blue/15 px-3 py-2">
                                <div className="font-display text-xs font-bold uppercase tracking-wide text-lime-serve">Poule {m.pouleLabel}</div>
                                <div className="truncate text-sm font-medium">
                                  {teamNameById[m.teamAId] ?? "?"} – {teamNameById[m.teamBId] ?? "?"}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-net-grey/40 px-3 py-2 text-center font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                                Vrij
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10 flex flex-col gap-4">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Knock-out</h2>
        <div className="overflow-x-auto rounded-2xl border border-flood-white/10">
          <table className="w-full min-w-[900px] border-collapse bg-surface">
            <thead>
              <tr>
                <th className="w-40 border-b border-flood-white/10 bg-surface-alt px-4 py-3 text-left font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
                  Fase
                </th>
                {courtNumbers.map((c) => (
                  <th
                    key={c}
                    className="border-b border-flood-white/10 bg-surface-alt px-3 py-3 text-center font-display text-sm font-bold uppercase tracking-wide text-ink-muted"
                  >
                    Baan {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KNOCKOUT_GROUPS.map((group) => {
                const window = windows.find((w) => w.status === `finale_ronde_${group.round}`);
                const defsByCourt = Object.fromEntries(
                  group.ids
                    .map((id) => bracketDefById[id])
                    .filter((def): def is NonNullable<typeof def> => Boolean(def))
                    .map((def) => [def.court, def])
                );
                return (
                  <tr key={group.title} className="border-b border-flood-white/8 last:border-b-0">
                    <td className="px-4 py-2.5 align-middle">
                      <div className="font-display text-lg font-bold">{group.title}</div>
                      {window ? (
                        <div className="text-xs tabular-nums text-ink-muted">
                          {fmtTime(window.startsAt)}–{fmtTime(window.endsAt!)}
                        </div>
                      ) : null}
                    </td>
                    {courtNumbers.map((court) => {
                      const def = defsByCourt[court];
                      return (
                        <td key={court} className="p-1.5 align-middle">
                          {def ? (
                            <div className="rounded-xl border border-clay-orange/50 bg-clay-orange/15 px-3 py-2">
                              <div className="font-display text-xs font-bold uppercase tracking-wide text-clay-orange">{def.label}</div>
                              <div className="truncate text-sm font-medium">
                                {describeSource(def.teamA)} – {describeSource(def.teamB)}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-net-grey/40 px-3 py-2 text-center font-display text-xs font-bold uppercase tracking-wide text-ink-muted">
                              Vrij
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
