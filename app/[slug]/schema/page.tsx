import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { generatePouleSchedule, playedCourts } from "@/lib/poule-scheduler";
import { computeSchedule, pouleRoundWindow, fmtTime, type PhaseWindow } from "@/lib/schedule";
import { PHASE_META } from "@/lib/phases";
import { BRACKET_DEFINITION, resolveBracketMatches, type ResolvedBracketMatch, type TeamSource } from "@/lib/bracket-engine";
import { Logo } from "@/components/logo";
import { fmtDateLong } from "@/lib/share-metadata";

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

interface MobileMatch {
  court: number;
  label: string;
  teams: string;
}

interface MobileBlock {
  title: string;
  startsAt: Date | null;
  endsAt: Date | null;
  matches: MobileMatch[];
  tone: "poule" | "knockout";
}

/** Phone layout: the desktop tables need ~1800px, so below `md` every round becomes its own card with one match per row. */
function MobileSchema({
  windows,
  rounds,
  knockout,
}: {
  windows: PhaseWindow[];
  rounds: Array<{ round: number; startsAt: Date; endsAt: Date; matches: MobileMatch[] }>;
  knockout: Array<{ title: string; startsAt: Date | null; endsAt: Date | null; matches: MobileMatch[] }>;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="font-mint text-2xl font-extrabold tracking-tight text-mint-ink">Dagindeling</h2>
        <div className="rounded-[20px] bg-white shadow-card">
          {windows.map((w) => (
            <div
              key={w.status}
              className="flex items-baseline justify-between gap-4 border-b border-mint-net/15 px-4 py-2.5 last:border-b-0"
            >
              <div className="font-mint text-sm font-bold text-mint-ink">{PHASE_META[w.status].label}</div>
              <div className="text-sm tabular-nums text-mint-ink-muted">
                {fmtTime(w.startsAt)}
                {w.endsAt ? `–${fmtTime(w.endsAt)}` : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {rounds.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-mint text-2xl font-extrabold tracking-tight text-mint-ink">Poulefase</h2>
          {rounds.map((r) => (
            <MobileBlockCard
              key={r.round}
              block={{ title: `Ronde ${r.round}`, startsAt: r.startsAt, endsAt: r.endsAt, matches: r.matches, tone: "poule" }}
            />
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-mint text-2xl font-extrabold tracking-tight text-mint-ink">Knock-out</h2>
        {knockout.map((k) => (
          <MobileBlockCard key={k.title} block={{ ...k, tone: "knockout" }} />
        ))}
      </section>
    </div>
  );
}

function MobileBlockCard({ block }: { block: MobileBlock }) {
  const tile =
    block.tone === "poule"
      ? { box: "border-glass-blue/40 bg-glass-blue/10", label: "text-mint-lime-ink" }
      : { box: "border-clay-orange/40 bg-clay-orange/10", label: "text-clay-orange" };
  return (
    <div className="rounded-[20px] bg-white p-3 shadow-card">
      <div className="flex items-baseline justify-between gap-4 px-1 pb-2">
        <div className="font-mint text-lg font-bold text-mint-ink">{block.title}</div>
        {block.startsAt ? (
          <div className="text-sm tabular-nums text-mint-ink-muted">
            {fmtTime(block.startsAt)}
            {block.endsAt ? `–${fmtTime(block.endsAt)}` : ""}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        {block.matches.map((m) => (
          <div key={m.court} className="flex items-stretch gap-2">
            <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-mint-net/10 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-mint-ink-muted">Baan</div>
              <div className="font-mint text-lg font-extrabold leading-none text-mint-ink">{m.court}</div>
            </div>
            <div className={`min-w-0 flex-1 rounded-xl border px-3 py-2 ${tile.box}`}>
              <div className={`font-mint text-xs font-bold ${tile.label}`}>{m.label}</div>
              <div className="text-sm font-medium text-mint-ink">{m.teams}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const courtNumbers = playedCourts(schedule, event.courts);
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
      <header className="flex items-center gap-4 bg-white px-4 py-5 md:hidden">
        <Logo variant="light" size="sm" className="shrink-0" />
        <div className="h-11 w-0.5 shrink-0 bg-mint-net/40" />
        <div className="min-w-0">
          <div className="font-mint text-2xl font-extrabold leading-tight tracking-tight text-mint-ink">{event.name}</div>
          <div className="mt-1 text-sm text-mint-ink-muted">
            {fmtDateLong(event.date)} · {event.startTime} · {event.location}
          </div>
        </div>
      </header>
      <header className="hidden items-center gap-7 bg-white px-16 py-8 md:flex">
        <Logo variant="light" size="xl" />
        <div className="h-11 w-0.5 bg-mint-net/40" />
        <div>
          <div className="font-mint text-5xl font-extrabold leading-none tracking-tight text-mint-ink">{event.name}</div>
          <div className="mt-1.5 text-xl text-mint-ink-muted">
            {fmtDateLong(event.date)} · {event.startTime} · {event.location}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:hidden">
        <MobileSchema
          windows={windows}
          rounds={Array.from({ length: schedule.roundsCount }, (_, i) => i + 1).map((round) => ({
            round,
            ...pouleRoundWindow(pouleStartsAt, round, event.schedule.pouleChangeoverMinutes),
            matches: schedule.matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.court - b.court)
              .map((m) => ({
                court: m.court,
                label: `Poule ${m.pouleLabel}`,
                teams: `${teamNameById[m.teamAId] ?? "?"} – ${teamNameById[m.teamBId] ?? "?"}`,
              })),
          }))}
          knockout={KNOCKOUT_GROUPS.map((group) => {
            const window = windows.find((w) => w.status === `finale_ronde_${group.round}`);
            return {
              title: group.title,
              startsAt: window?.startsAt ?? null,
              endsAt: window?.endsAt ?? null,
              matches: group.ids
                .map((id) => bracketDefById[id])
                .filter((def): def is NonNullable<typeof def> => Boolean(def))
                .sort((a, b) => a.court - b.court)
                .map((def) => ({
                  court: def.court,
                  label: def.label,
                  teams: `${describeSlot(def.id, def.teamA, "A")} – ${describeSlot(def.id, def.teamB, "B")}`,
                })),
            };
          })}
        />
      </main>

      <main className="hidden px-16 py-12 md:block">
      <section className="mt-10 flex flex-col gap-4">
        <h2 className="font-mint text-3xl font-extrabold tracking-tight text-mint-ink">Dagindeling</h2>
        <div className="flex overflow-x-auto rounded-[28px] bg-white shadow-card">
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
          <h2 className="font-mint text-3xl font-extrabold tracking-tight text-mint-ink">Poulefase</h2>
          <div className="overflow-x-auto rounded-[28px] bg-white shadow-card">
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
        <h2 className="font-mint text-3xl font-extrabold tracking-tight text-mint-ink">Knock-out</h2>
        <div className="overflow-x-auto rounded-[28px] bg-white shadow-card">
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
