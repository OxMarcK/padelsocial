import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { computeSchedule, pouleRoundWindow, fmtTime } from "@/lib/schedule";
import { PHASE_META } from "@/lib/phases";
import { BRACKET_DEFINITION, resolveBracketMatches, type ResolvedBracketMatch, type TeamSource } from "@/lib/bracket-engine";
import { Logo } from "@/components/logo";

/** Before the top-8 is published/played, a slot can only describe the *rule* that decides it. */
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

/** Design 6A trial: /schema restyled for the light "mint" palette — no canvas reference for this screen, extrapolates the established tokens directly onto the existing tables. */
export default async function SchemaPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules, matches, top8State] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
    repo.getTop8(event.id),
  ]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const windows = computeSchedule(event, schedule.roundsCount || 1);
  const pouleStartsAt = windows.find((w) => w.status === "poulefase")!.startsAt;
  const courtNumbers = Array.from({ length: event.courts }, (_, i) => i + 1);
  const bracketDefById = Object.fromEntries(BRACKET_DEFINITION.map((d) => [d.id, d]));

  // Once the top-8 is published, show the actual team names instead of the
  // generic "Seed N"/"Winnaar KF1" placeholders — same source the Standen
  // bracket tab uses (see app/[slug]/standen/page.tsx).
  const bracketResults: Record<string, { scoreA: number; scoreB: number }> = {};
  for (const m of matches) {
    if (m.bracketMatchId && m.scoreA !== null && m.scoreB !== null) {
      bracketResults[m.bracketMatchId] = { scoreA: m.scoreA, scoreB: m.scoreB };
    }
  }
  const resolvedById: Record<string, ResolvedBracketMatch> = top8State
    ? Object.fromEntries(resolveBracketMatches(top8State.top8, bracketResults).map((m) => [m.id, m]))
    : {};

  function describeSlot(defId: string, source: TeamSource, side: "A" | "B"): string {
    const resolvedId = side === "A" ? resolvedById[defId]?.teamAId : resolvedById[defId]?.teamBId;
    return resolvedId ? teamNameById[resolvedId] ?? "?" : describeSource(source);
  }

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="flex items-center gap-7 bg-white px-16 py-8">
        <Logo variant="light" size="xl" />
        <div className="h-11 w-0.5 bg-mint-net/40" />
        <div>
          <div className="font-mint text-5xl font-bold leading-none text-mint-ink">{event.name}</div>
          <div className="mt-1.5 text-xl text-mint-ink-muted">
            {event.date} · {event.startTime} · {event.location}
          </div>
        </div>
      </header>

      <main className="px-16 py-12">
      <section className="mt-10 flex flex-col gap-4">
        <h2 className="font-mint text-3xl font-bold text-mint-ink">Dagindeling</h2>
        <div className="flex overflow-x-auto rounded-[28px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          {windows.map((w) => (
            <div key={w.status} className="min-w-[170px] flex-1 border-r border-mint-net/15 px-5 py-4 last:border-r-0">
              <div className="font-mint text-base font-bold text-mint-ink">{PHASE_META[w.status].label}</div>
              <div className="mt-1 text-sm tabular-nums text-mint-ink-muted">
                {fmtTime(w.startsAt)}
                {w.endsAt ? `–${fmtTime(w.endsAt)}` : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {schedule.roundsCount > 0 ? (
        <section className="mt-10 flex flex-col gap-4">
          <h2 className="font-mint text-3xl font-bold text-mint-ink">Poulefase</h2>
          <div className="overflow-x-auto rounded-[28px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)]">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className="w-40 border-b border-mint-net/15 bg-mint-net/10 px-4 py-3 text-left font-mint text-sm font-bold text-mint-ink-muted">
                    Ronde
                  </th>
                  {courtNumbers.map((c) => (
                    <th
                      key={c}
                      className="border-b border-mint-net/15 bg-mint-net/10 px-3 py-3 text-center font-mint text-sm font-bold text-mint-ink-muted"
                    >
                      Baan {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: schedule.roundsCount }, (_, i) => i + 1).map((round) => {
                  const { startsAt, endsAt } = pouleRoundWindow(pouleStartsAt, round, event.schedule.pouleChangeoverMinutes);
                  const byCourt = Object.fromEntries(schedule.matches.filter((m) => m.round === round).map((m) => [m.court, m]));
                  return (
                    <tr key={round} className="border-b border-mint-net/10 last:border-b-0">
                      <td className="px-4 py-2.5 align-middle">
                        <div className="font-mint text-lg font-bold text-mint-ink">Ronde {round}</div>
                        <div className="text-xs tabular-nums text-mint-ink-muted">
                          {fmtTime(startsAt)}–{fmtTime(endsAt)}
                        </div>
                      </td>
                      {courtNumbers.map((court) => {
                        const m = byCourt[court];
                        return (
                          <td key={court} className="p-1.5 align-middle">
                            {m ? (
                              <div className="rounded-xl border border-glass-blue/40 bg-glass-blue/10 px-3 py-2">
                                <div className="font-mint text-xs font-bold text-mint-lime-ink">Poule {m.pouleLabel}</div>
                                <div className="truncate text-sm font-medium text-mint-ink">
                                  {teamNameById[m.teamAId] ?? "?"} – {teamNameById[m.teamBId] ?? "?"}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-mint-net/40 px-3 py-2 text-center font-mint text-xs font-bold text-mint-ink-muted">
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
        <h2 className="font-mint text-3xl font-bold text-mint-ink">Knock-out</h2>
        <div className="overflow-x-auto rounded-[28px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className="w-40 border-b border-mint-net/15 bg-mint-net/10 px-4 py-3 text-left font-mint text-sm font-bold text-mint-ink-muted">
                  Fase
                </th>
                {courtNumbers.map((c) => (
                  <th
                    key={c}
                    className="border-b border-mint-net/15 bg-mint-net/10 px-3 py-3 text-center font-mint text-sm font-bold text-mint-ink-muted"
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
                  <tr key={group.title} className="border-b border-mint-net/10 last:border-b-0">
                    <td className="px-4 py-2.5 align-middle">
                      <div className="font-mint text-lg font-bold text-mint-ink">{group.title}</div>
                      {window ? (
                        <div className="text-xs tabular-nums text-mint-ink-muted">
                          {fmtTime(window.startsAt)}–{fmtTime(window.endsAt!)}
                        </div>
                      ) : null}
                    </td>
                    {courtNumbers.map((court) => {
                      const def = defsByCourt[court];
                      return (
                        <td key={court} className="p-1.5 align-middle">
                          {def ? (
                            <div className="rounded-xl border border-clay-orange/40 bg-clay-orange/10 px-3 py-2">
                              <div className="font-mint text-xs font-bold text-clay-orange">{def.label}</div>
                              <div className="truncate text-sm font-medium text-mint-ink">
                                {describeSlot(def.id, def.teamA, "A")} – {describeSlot(def.id, def.teamB, "B")}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-mint-net/40 px-3 py-2 text-center font-mint text-xs font-bold text-mint-ink-muted">
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
    </div>
  );
}
