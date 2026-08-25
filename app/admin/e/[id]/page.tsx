import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { computeStandings } from "@/lib/standings";
import { PHASE_META, bracketRoundForStatus, nextStatus } from "@/lib/phases";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { MatchBoard } from "@/components/admin/match-board";
import {
  addTeamsBulk,
  advancePhase,
  advancePouleRound,
  attachVideo,
  finishEvent,
  publishPouleMatches,
  publishTop8Override,
  randomizePoules,
  recordScore,
  savePoulesManual,
  updatePoints,
} from "./actions";

const POULE_LABEL_OPTIONS = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i)); // A..H

export default async function AdminEventPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const event = await repo.getEvent(params.id);
  if (!event) notFound();

  const [teams, poules, matches, top8] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
    repo.getTop8(event.id),
  ]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const meta = PHASE_META[event.status];
  const next = nextStatus(event.status);

  const pouleMatches = matches.filter((m) => m.phase === "poule");
  const schedulePreview =
    poules.length > 0
      ? generatePouleSchedule(
          poules.map((p) => ({ label: p.label, teamIds: p.teamIds })),
          event.courts
        )
      : null;

  const currentRoundMatches = pouleMatches.filter((m) => m.roundNumber === event.currentPouleRound);
  const bracketRound = bracketRoundForStatus(event.status);
  const currentBracketMatches = bracketRound ? matches.filter((m) => m.roundNumber === bracketRound && m.phase !== "poule") : [];

  const recordScoreBound = recordScore.bind(null, event.id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">{event.name}</h1>
        <p className="text-sm text-ink-muted">
          {event.date} · {event.location} · {event.courts} banen
        </p>
        <p className="mt-2 font-display text-lg font-bold uppercase tracking-wider text-lime-serve">{meta.label}</p>
      </div>

      {meta.advanceCta && next ? (
        <ConfirmButton
          label={meta.advanceCta}
          confirmText={confirmTextFor(event.status, teams.length)}
          action={advancePhase.bind(null, event.id)}
        />
      ) : null}

      <Section title="Teams" subtitle={`${teams.length} teams`}>
        <form action={addTeamsBulk.bind(null, event.id)} className="flex flex-col gap-2">
          <textarea
            name="bulk"
            rows={4}
            placeholder={"Team naam | Speler 1 | Speler 2\nSanne & Joep | Sanne | Joep"}
            className="rounded-xl border border-flood-white/15 bg-court-night px-3 py-2 text-sm text-flood-white placeholder:text-ink-muted"
          />
          <Button type="submit" variant="secondary">
            Teams toevoegen
          </Button>
        </form>
        {teams.length > 0 ? (
          <div className="mt-3 flex flex-col gap-1.5">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-xl bg-flood-white/5 px-3 py-2 text-sm">
                <span className="flex-1 truncate">{t.name}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Poules" subtitle="Verdeel de teams over poules — 5 teams per poule, zoveel poules als je nodig hebt">
        <form action={savePoulesManual.bind(null, event.id)} className="flex flex-col gap-2">
          {teams.map((t) => {
            const current = poules.find((p) => p.teamIds.includes(t.id))?.label ?? "";
            return (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{t.name}</span>
                <select
                  key={current}
                  name={`poule_${t.id}`}
                  defaultValue={current}
                  className="h-9 rounded-lg border border-flood-white/15 bg-court-night px-2 text-flood-white"
                >
                  <option value="">–</option>
                  {POULE_LABEL_OPTIONS.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          <div className="mt-2 flex gap-2">
            <Button type="submit" variant="secondary">
              Opslaan verdeling
            </Button>
          </div>
        </form>
        <form action={randomizePoules.bind(null, event.id)} className="mt-2 flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-ink-muted">Aantal poules</span>
            <input
              type="number"
              name="pouleCount"
              min={1}
              defaultValue={Math.max(1, Math.round(teams.length / 5) || 1)}
              className="h-9 w-20 rounded-lg border border-flood-white/15 bg-court-night px-2 text-flood-white"
            />
          </label>
          <Button type="submit" variant="ghost">
            Willekeurig verdelen (5 per poule)
          </Button>
        </form>
      </Section>

      <Section title="Poulewedstrijden" subtitle="Configureer punten en genereer het schema">
        <form action={updatePoints.bind(null, event.id)} className="mb-3 flex items-end gap-2">
          <PointField label="Winst" name="win" defaultValue={event.points.win} />
          <PointField label="Gelijk" name="draw" defaultValue={event.points.draw} />
          <PointField label="Verlies" name="loss" defaultValue={event.points.loss} />
          <Button type="submit" variant="ghost">
            Punten opslaan
          </Button>
        </form>

        {schedulePreview ? (
          <p className="mb-2 text-xs text-ink-muted">
            {schedulePreview.matches.length} wedstrijden over {schedulePreview.roundsCount} rondes (5 banen elke
            ronde vol — zie lib/poule-scheduler.ts voor waarom dit er {schedulePreview.roundsCount} zijn, niet 5).
          </p>
        ) : (
          <p className="mb-2 text-xs text-ink-muted">Verdeel eerst de teams over de poules.</p>
        )}

        <form action={publishPouleMatches.bind(null, event.id)}>
          <Button type="submit" disabled={!schedulePreview}>
            {pouleMatches.length > 0 ? "Opnieuw genereren" : "Genereer poulewedstrijden"}
          </Button>
        </form>
      </Section>

      {meta.showCourts && event.status === "poulefase" && pouleMatches.length > 0 ? (
        <Section title="Scores invoeren" subtitle={`Ronde ${event.currentPouleRound} van ${schedulePreview?.roundsCount ?? "?"}`}>
          <MatchBoard matches={currentRoundMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
          <form action={advancePouleRound.bind(null, event.id)} className="mt-3">
            <Button type="submit" variant="ghost">
              Volgende ronde binnen poulefase
            </Button>
          </form>
        </Section>
      ) : null}

      {event.status === "pauze_1" ? (
        <Section title="Top 8 & plaatsingsgroep" subtitle="Controleer de seeding voordat je publiceert">
          <Top8Editor eventId={event.id} teamNameById={teamNameById} published={top8} />
        </Section>
      ) : null}

      {bracketRound && currentBracketMatches.length > 0 ? (
        <Section title="Scores invoeren" subtitle={meta.label}>
          <MatchBoard matches={currentBracketMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
        </Section>
      ) : null}

      {matches.some((m) => m.scoreA !== null) ? (
        <Section title="Video's koppelen" subtitle="Plak een YouTube-link per wedstrijd">
          <div className="flex flex-col gap-2">
            {matches
              .filter((m) => m.scoreA !== null && m.scoreB !== null)
              .map((m) => (
                <form key={m.id} action={attachVideo.bind(null, event.id)} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="matchId" value={m.id} />
                  <span className="w-40 flex-none truncate text-ink-muted">{m.label}</span>
                  <input
                    type="url"
                    name="videoUrl"
                    defaultValue={m.videoUrl ?? ""}
                    placeholder="https://youtube.com/…"
                    className="h-9 flex-1 rounded-lg border border-flood-white/15 bg-court-night px-2 text-flood-white placeholder:text-ink-muted"
                  />
                  <Button type="submit" variant="ghost">
                    Opslaan
                  </Button>
                </form>
              ))}
          </div>
        </Section>
      ) : null}

      {event.status === "prijsuitreiking" ? (
        <Section title="Afronden">
          <ConfirmButton
            label="Evenement afronden"
            confirmText="Eindstand vastzetten en de resultatenpagina publiceren?"
            action={finishEvent.bind(null, event.id)}
          />
        </Section>
      ) : null}
    </main>
  );
}

function confirmTextFor(status: string, teamCount: number) {
  if (status === "draft") return `Poulefase starten met ${teamCount} teams?`;
  if (status === "pauze_1") return "Kwartfinales starten met de gepubliceerde top 8?";
  return "Doorgaan naar de volgende fase?";
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-flood-white/10 bg-court-night p-4">
      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">{title}</h2>
        {subtitle ? <p className="text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function PointField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-ink-muted">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        className="h-9 w-16 rounded-lg border border-flood-white/15 bg-court-night px-2 text-flood-white"
      />
    </label>
  );
}

async function Top8Editor({
  eventId,
  teamNameById,
  published,
}: {
  eventId: string;
  teamNameById: Record<string, string>;
  published: Awaited<ReturnType<typeof repo.getTop8>>;
}) {
  const preview = await repo.previewTop8(eventId);
  const state = published ?? preview;
  const name = (id: string) => teamNameById[id] ?? "?";

  return (
    <form action={publishTop8Override.bind(null, eventId)} className="flex flex-col gap-3 text-sm">
      <p className="text-xs text-ink-muted">
        Seed 1 t/m 8, beste eerst. Kwartfinales spelen 1-8, 4-5, 2-7, 3-6 (standaard bracket-seeding), zodat seed 1
        en 2 elkaar pas in de finale kunnen treffen.
      </p>
      {state.top8.seeds.map((teamId, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-16 flex-none text-ink-muted">Seed {i + 1}</span>
          <input
            name={`seed${i + 1}`}
            defaultValue={teamId}
            className="h-9 flex-1 rounded-lg border border-flood-white/15 bg-court-night px-2 text-flood-white"
          />
          <span className="w-32 flex-none truncate text-xs text-ink-muted">{name(teamId)}</span>
        </div>
      ))}
      <label className="flex flex-col gap-1">
        <span className="text-ink-muted">Plaatsingsgroep, beste naar slechtste (team-id&apos;s, komma-gescheiden)</span>
        <input
          name="placementSeeds"
          defaultValue={state.placementSeeds.join(",")}
          className="h-9 rounded-lg border border-flood-white/15 bg-court-night px-2 text-flood-white"
        />
      </label>
      <p className="text-xs text-ink-muted">
        {state.placementSeeds.map((id) => name(id)).join(" · ")}
      </p>
      <Button type="submit" variant="secondary">
        {published ? "Bijwerken" : "Publiceren"}
      </Button>
    </form>
  );
}
