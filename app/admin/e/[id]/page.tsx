import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { computeSchedule, phaseIndicatorData } from "@/lib/schedule";
import { PHASE_META, bracketRoundForStatus, highestStartedBracketRound, nextStatus } from "@/lib/phases";
import { Field } from "@/components/ui/field";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, ActionFormError, SaveButton } from "@/components/admin/action-form";
import { MatchBoard } from "@/components/admin/match-board";
import { PhaseTimeline } from "@/components/mint/phase-timeline";
import { LiveCountdownText } from "@/components/mint/live-countdown";
import {
  addTeamsBulk,
  advancePhase,
  advancePouleRound,
  attachVideo,
  deleteEvent,
  deleteTeam,
  duplicateEvent,
  publishPouleMatches,
  publishTop8Override,
  randomizePoules,
  recomputePlacements,
  recordScore,
  renameTeam,
  savePoulesManual,
  updateEventDetails,
  updatePoints,
} from "./actions";
import { normalizeSlug } from "@/lib/slug";

const POULE_LABEL_OPTIONS = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i)); // A..H
const TABS = [
  { key: "teams", label: "Teams" },
  { key: "poules", label: "Poules" },
  { key: "scores", label: "Scores" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; round?: string };
}) {
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

  const windows = computeSchedule(event, schedulePreview?.roundsCount || event.currentPouleRound || 1);
  const indicator = phaseIndicatorData(event, schedulePreview?.roundsCount || event.currentPouleRound || 1);

  const currentRoundMatches = pouleMatches.filter((m) => m.roundNumber === event.currentPouleRound);
  const missingScores = currentRoundMatches.filter((m) => m.scoreA === null || m.scoreB === null).length;
  const pouleRoundsCount = schedulePreview?.roundsCount ?? event.currentPouleRound;
  const requestedRound = Number(searchParams.round);
  const viewedRound =
    requestedRound >= 1 && requestedRound <= pouleRoundsCount ? requestedRound : event.currentPouleRound;
  const viewedRoundMatches = pouleMatches.filter((m) => m.roundNumber === viewedRound);
  const bracketRound = bracketRoundForStatus(event.status);
  const bracketMatches = matches.filter((m) => m.phase !== "poule");
  const currentBracketMatches = bracketRound ? bracketMatches.filter((m) => m.roundNumber === bracketRound) : [];
  const bracketMissingScores = currentBracketMatches.filter((m) => m.scoreA === null || m.scoreB === null).length;
  // Matches from a bracket round that has already started (per the event's own phase
  // history, not just "resolvable") but got skipped over unscored — e.g. the admin
  // advanced the phase before scoring them. Their teams are known but no score was
  // recorded, and since the current round's own matches are just winnerOf/loserOf
  // lookups over the results map, catching these up here is enough to unstick a later
  // round automatically. Gating on "started" (not just "not the current round") matters
  // because a later round's teams can already be resolvable — e.g. HF1 as soon as both
  // its KFs are done — without that round having actually begun yet.
  const startedBracketRound = highestStartedBracketRound(event.status);
  const catchUpBracketMatches = bracketMatches.filter(
    (m) =>
      m.roundNumber <= startedBracketRound &&
      m.roundNumber !== bracketRound &&
      m.teamAId &&
      m.teamBId &&
      (m.scoreA === null || m.scoreB === null)
  );

  const recordScoreBound = recordScore.bind(null, event.id);

  // Not-yet-linked matches float to the top — that's the actual to-do here, and the list
  // only grows over the course of an event, so surfacing what's missing beats chronological order.
  const scoredMatches = matches
    .filter((m) => m.scoreA !== null && m.scoreB !== null)
    .sort((a, b) => Number(!!a.videoUrl) - Number(!!b.videoUrl));
  const videosLinkedCount = scoredMatches.filter((m) => m.videoUrl).length;

  const defaultTab: TabKey = pouleMatches.length > 0 ? "scores" : poules.length > 0 ? "poules" : "teams";
  const requestedTab = searchParams.tab;
  const tab: TabKey = TABS.some((t) => t.key === requestedTab) ? (requestedTab as TabKey) : defaultTab;
  const tabHref = (key: TabKey) => `/admin/e/${event.id}?tab=${key}`;

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="font-mint text-4xl font-bold text-mint-ink">{event.name}</h1>
        <p className="text-sm text-mint-ink-muted">
          {event.date} · {event.location} · {event.courts} banen
        </p>
      </div>

      <PhaseTimeline windows={windows} currentStatus={event.status} />

      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mint text-lg font-bold text-mint-ink">{indicator.phaseLabel}</div>
            <div className="text-sm text-mint-ink-muted">{indicator.subLabel}</div>
          </div>
          <div className="flex-none text-right text-xs text-mint-ink-muted">{indicator.timeWindowText}</div>
        </div>

        {indicator.countdownText && indicator.countdownStartsAt && indicator.countdownEndsAt ? (
          <div className="mt-3 flex items-baseline gap-2 border-t border-mint-net/15 pt-3">
            <span className="font-mint text-3xl font-bold tabular-nums text-mint-lime-ink">
              <LiveCountdownText
                startsAtIso={indicator.countdownStartsAt}
                endsAtIso={indicator.countdownEndsAt}
                initialText={indicator.countdownText}
              />
            </span>
            <span className="text-xs text-mint-ink-muted">resterend · {indicator.nextLine}</span>
          </div>
        ) : (
          <div className="mt-3 border-t border-mint-net/15 pt-3 text-xs text-mint-ink-muted">{indicator.nextLine}</div>
        )}

        {meta.advanceCta && next ? (
          <div className="mt-4">
            {bracketRound && bracketMissingScores > 0 ? (
              <ConfirmButton
                key={event.status}
                label={meta.advanceCta}
                confirmText={`Nog ${bracketMissingScores} wedstrijd${bracketMissingScores === 1 ? "" : "en"} niet gescoord in ${meta.label.toLowerCase()}. Toch doorgaan?`}
                action={advancePhase.bind(null, event.id, event.status)}
                variant="secondary"
                successMessage="Doorgezet naar de volgende fase."
              />
            ) : (
              <ConfirmButton
                key={event.status}
                label={meta.advanceCta}
                confirmText={confirmTextFor(event.status, teams.length)}
                action={advancePhase.bind(null, event.id, event.status)}
                successMessage="Doorgezet naar de volgende fase."
              />
            )}
          </div>
        ) : null}
      </div>

      <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            className={`flex-1 rounded-xl py-2 text-center font-mint text-sm font-bold ${
              tab === t.key ? "bg-mint-lime text-mint-lime-ink" : "text-mint-ink-muted"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "teams" ? (
        <Section title="Teams" subtitle={`${teams.length} teams`}>
          <ActionForm action={addTeamsBulk.bind(null, event.id)} className="flex flex-col gap-2" resetOnSuccess>
            <textarea
              name="bulk"
              rows={4}
              placeholder={"Team naam | Speler 1 | Speler 2\nSanne & Joep | Sanne | Joep"}
              className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-sm text-mint-ink placeholder:text-mint-ink-muted/60"
            />
            <SaveButton label="Teams toevoegen" savedLabel="Toegevoegd" />
          </ActionForm>
          {teams.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1.5">
              {teams.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-mint-net/10 px-3 py-2 text-sm">
                  <ActionForm action={renameTeam.bind(null, event.id, t.id)} className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      name="name"
                      defaultValue={t.name}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink"
                    />
                    <SaveButton variant="ghost" size="sm" />
                  </ActionForm>
                  <ConfirmButton
                    label="Verwijderen"
                    icon="✕"
                    confirmText={`"${t.name}" verwijderen?`}
                    action={deleteTeam.bind(null, event.id, t.id)}
                    variant="danger"
                    size="sm"
                    successMessage="Team verwijderd."
                  />
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {tab === "poules" ? (
        <>
          <Section title="Poules" subtitle="Verdeel de teams over poules — 5 teams per poule, zoveel poules als je nodig hebt">
            <ActionForm action={savePoulesManual.bind(null, event.id)} className="flex flex-col gap-2">
              {teams.map((t) => {
                const current = poules.find((p) => p.teamIds.includes(t.id))?.label ?? "";
                return (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-mint-ink">{t.name}</span>
                    <select
                      key={current}
                      name={`poule_${t.id}`}
                      defaultValue={current}
                      className="h-9 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink"
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
                <SaveButton label="Opslaan verdeling" />
              </div>
            </ActionForm>
            <ActionForm action={randomizePoules.bind(null, event.id)} className="mt-2 flex items-end gap-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-mint-ink-muted">Aantal poules</span>
                <input
                  type="number"
                  name="pouleCount"
                  min={1}
                  defaultValue={Math.max(1, Math.round(teams.length / 5) || 1)}
                  className="h-9 w-20 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink"
                />
              </label>
              <SaveButton variant="ghost" label="Willekeurig verdelen (5 per poule)" savedLabel="Verdeeld" />
            </ActionForm>
          </Section>

          <Section title="Poulewedstrijden" subtitle="Configureer punten en genereer het schema">
            <ActionForm action={updatePoints.bind(null, event.id)} className="mb-3 flex items-end gap-2">
              <PointField label="Winst" name="win" defaultValue={event.points.win} />
              <PointField label="Gelijk" name="draw" defaultValue={event.points.draw} />
              <PointField label="Verlies" name="loss" defaultValue={event.points.loss} />
              <SaveButton variant="ghost" label="Punten opslaan" />
            </ActionForm>

            {schedulePreview ? (
              <p className="mb-2 text-xs text-mint-ink-muted">
                {schedulePreview.matches.length} wedstrijden over {schedulePreview.roundsCount} rondes (5 banen elke
                ronde vol — zie lib/poule-scheduler.ts voor waarom dit er {schedulePreview.roundsCount} zijn, niet 5).
              </p>
            ) : (
              <p className="mb-2 text-xs text-mint-ink-muted">Verdeel eerst de teams over de poules.</p>
            )}

            <ActionForm action={publishPouleMatches.bind(null, event.id)}>
              <SaveButton
                disabled={!schedulePreview}
                variant="primary"
                label={pouleMatches.length > 0 ? "Opnieuw genereren" : "Genereer poulewedstrijden"}
                savedLabel="Gegenereerd"
              />
            </ActionForm>
          </Section>
        </>
      ) : null}

      {tab === "scores" ? (
        <>
          {meta.showCourts && event.status === "poulefase" && pouleMatches.length > 0 ? (
            <Section title="Scores invoeren" subtitle={`Ronde ${viewedRound} van ${pouleRoundsCount}`}>
              <div className="mb-3 flex flex-wrap gap-2">
                {Array.from({ length: pouleRoundsCount }, (_, i) => i + 1).map((r) => (
                  <Link
                    key={r}
                    href={`/admin/e/${event.id}?tab=scores&round=${r}`}
                    className={`flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-mint font-bold ${
                      viewedRound === r ? "border-glass-blue bg-glass-blue text-white" : "border-mint-net/25 bg-white text-mint-ink-muted"
                    }`}
                  >
                    Ronde {r}
                  </Link>
                ))}
              </div>
              <MatchBoard matches={viewedRoundMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
              {viewedRound === event.currentPouleRound ? (
                missingScores > 0 ? (
                  <div className="mt-3">
                    <ConfirmButton
                      key={event.currentPouleRound}
                      label="Volgende ronde binnen poulefase"
                      confirmText={`Nog ${missingScores} wedstrijd${missingScores === 1 ? "" : "en"} niet gescoord in ronde ${event.currentPouleRound}. Toch doorgaan naar de volgende ronde?`}
                      action={advancePouleRound.bind(null, event.id, event.currentPouleRound)}
                      variant="secondary"
                      successMessage="Volgende ronde gestart."
                    />
                  </div>
                ) : (
                  <ActionForm
                    key={event.currentPouleRound}
                    action={advancePouleRound.bind(null, event.id, event.currentPouleRound)}
                    className="mt-3"
                  >
                    <SaveButton
                      variant="ghost"
                      label="Volgende ronde binnen poulefase"
                      savedLabel="Volgende ronde gestart"
                    />
                  </ActionForm>
                )
              ) : (
                <p className="mt-3 text-xs text-mint-ink-muted">
                  Je bekijkt een eerdere ronde. Ga naar ronde {event.currentPouleRound} om door te gaan naar de
                  volgende ronde.
                </p>
              )}
            </Section>
          ) : null}

          {event.status === "pauze_1" ? (
            <Section title="Top 8 & plaatsingsgroep" subtitle="Controleer de seeding voordat je publiceert">
              <Top8Editor eventId={event.id} teams={teams} published={top8} />
            </Section>
          ) : null}

          {catchUpBracketMatches.length > 0 ? (
            <Section
              title="Nog niet gescoorde wedstrijden"
              subtitle="Deze zijn overgeslagen doordat de fase al is doorgezet — vul ze alsnog in om de volgende ronde te ontgrendelen"
            >
              <MatchBoard matches={catchUpBracketMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
            </Section>
          ) : null}

          {bracketRound && currentBracketMatches.length > 0 ? (
            <Section title="Scores invoeren" subtitle={meta.label}>
              <MatchBoard matches={currentBracketMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
            </Section>
          ) : null}

          {scoredMatches.length > 0 ? (
            <Section
              title="Video's koppelen"
              subtitle={`${videosLinkedCount} van ${scoredMatches.length} wedstrijden gekoppeld`}
            >
              <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                {scoredMatches.map((m) => (
                  <ActionForm
                    key={m.id}
                    action={attachVideo.bind(null, event.id)}
                    className="flex flex-col gap-1.5 rounded-xl bg-mint-net/10 p-3 text-sm"
                  >
                    <input type="hidden" name="matchId" value={m.id} />
                    <div className="flex items-center gap-1.5">
                      {m.videoUrl ? <span aria-hidden className="text-mint-lime-ink">✓</span> : null}
                      <span className="truncate text-mint-ink-muted">{m.label}</span>
                    </div>
                    <span className="truncate font-semibold text-mint-ink">
                      {m.teamAId ? teamNameById[m.teamAId] ?? "?" : "?"} vs {m.teamBId ? teamNameById[m.teamBId] ?? "?" : "?"}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        name="videoUrl"
                        defaultValue={m.videoUrl ?? ""}
                        placeholder="https://youtube.com/…"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink placeholder:text-mint-ink-muted/60"
                      />
                      <SaveButton variant="ghost" size="sm" />
                    </div>
                  </ActionForm>
                ))}
              </div>
            </Section>
          ) : null}

        </>
      ) : null}

      {event.status === "finished" ? (
        <Section title="Eindstand" subtitle="Herbereken de eindstand op basis van de huidige wedstrijduitslagen">
          <p className="text-xs text-mint-ink-muted">
            Nodig als het event werd afgerond terwijl de halve finales of finales nog niet (volledig) gescoord waren
            — de publieke eindstand liet dan &quot;?&quot; zien op die plekken. Werkt de eindstand bij zonder de
            afgeronde status te wijzigen.
          </p>
          <ConfirmButton
            label="Herbereken eindstand"
            confirmText="Eindstand opnieuw berekenen op basis van de huidige scores?"
            action={recomputePlacements.bind(null, event.id)}
            variant="secondary"
            successMessage="Eindstand herberekend."
          />
        </Section>
      ) : null}

      <details className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)]">
        <summary className="cursor-pointer px-4 py-4 font-mint text-lg font-bold text-mint-ink">Instellingen</summary>
        <div className="flex flex-col gap-6 border-t border-mint-net/15 px-4 pb-4 pt-4">
          <div className="flex flex-col gap-3">
            <h3 className="font-mint text-sm font-bold text-mint-ink-muted">Event bewerken</h3>
            <ActionForm action={updateEventDetails.bind(null, event.id)} className="flex flex-col gap-3">
              <Field label="Naam" name="name" defaultValue={event.name} required />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-mint-ink-muted">Slug (voor de URL)</span>
                <input
                  name="slug"
                  defaultValue={event.slug}
                  required
                  className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
                />
                <span className="text-xs text-mint-ink-muted">
                  Publieke link wordt event.padelsocial.nl/{event.slug} — al gedeelde links met de oude slug werken
                  hierna niet meer.
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Datum" name="date" type="date" defaultValue={event.date} required />
                <Field label="Starttijd" name="startTime" type="time" defaultValue={event.startTime} required />
              </div>
              <Field label="Locatie" name="location" defaultValue={event.location} required />
              <Field label="Aantal banen" name="courts" type="number" defaultValue={event.courts} required />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-mint-ink-muted">Omschrijving</span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={event.description}
                  className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
                />
              </label>
              <ActionFormError />
              <SaveButton />
            </ActionForm>
          </div>

          <div className="flex flex-col gap-3 border-t border-mint-net/15 pt-6">
            <h3 className="font-mint text-sm font-bold text-mint-ink-muted">Dupliceer event</h3>
            <p className="text-xs text-mint-ink-muted">
              Maakt een nieuw event met dezelfde teams en poule-indeling — handig om een fase of het schema te
              testen zonder dit event te raken. Het nieuwe event begint bij Inchecken (nog geen wedstrijden of
              scores).
            </p>
            <ActionForm action={duplicateEvent.bind(null, event.id)} className="flex flex-col gap-3">
              <Field label="Naam" name="name" defaultValue={`${event.name} (test)`} required />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-mint-ink-muted">Slug (voor de URL)</span>
                <input
                  name="slug"
                  defaultValue={normalizeSlug(`${event.slug}-test`)}
                  required
                  className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
                />
              </label>
              <ActionFormError />
              <SaveButton label="Dupliceren" savedLabel="Gedupliceerd" />
            </ActionForm>
          </div>

          <div className="flex flex-col gap-3 border-t border-mint-net/15 pt-6">
            <h3 className="font-mint text-sm font-bold text-clay-orange">Gevarenzone</h3>
            <ConfirmButton
              label="Event verwijderen"
              confirmText={`"${event.name}" permanent verwijderen? Alle teams, poules en wedstrijden gaan verloren.`}
              action={deleteEvent.bind(null, event.id)}
              variant="danger"
            />
          </div>
        </div>
      </details>
    </main>
    </div>
  );
}

function confirmTextFor(status: string, teamCount: number) {
  if (status === "draft") return `Poulefase starten met ${teamCount} teams?`;
  if (status === "pauze_1") return "Kwartfinales starten met de gepubliceerde top 8?";
  if (status === "prijsuitreiking") return "Eindstand vastzetten en de resultatenpagina publiceren?";
  return "Doorgaan naar de volgende fase?";
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div>
        <h2 className="font-mint text-xl font-bold text-mint-ink">{title}</h2>
        {subtitle ? <p className="text-xs text-mint-ink-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function PointField({ label, name, defaultValue }: { label: string; name: string; defaultValue: number }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-mint-ink-muted">{label}</span>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        className="h-9 w-16 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink"
      />
    </label>
  );
}

async function Top8Editor({
  eventId,
  teams,
  published,
}: {
  eventId: string;
  teams: Array<{ id: string; name: string }>;
  published: Awaited<ReturnType<typeof repo.getTop8>>;
}) {
  const preview = await repo.previewTop8(eventId);
  const state = published ?? preview;
  const placementTeamIds = state.placementSeeds.length > 0 ? state.placementSeeds : teams.map((t) => t.id).filter((id) => !state.top8.seeds.includes(id));

  return (
    <ActionForm action={publishTop8Override.bind(null, eventId)} className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-mint-ink-muted">
          Seed 1 t/m 8, beste eerst. Kwartfinales spelen 1-8, 4-5, 2-7, 3-6 (standaard bracket-seeding), zodat seed 1
          en 2 elkaar pas in de finale kunnen treffen.
        </p>
        {state.top8.seeds.map((teamId, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 flex-none text-mint-ink-muted">Seed {i + 1}</span>
            <TeamSelect name={`seed${i + 1}`} teams={teams} defaultValue={teamId} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-mint-net/15 pt-3">
        <p className="text-xs text-mint-ink-muted">
          Overige teams, plek 9 en verder — bepaalt direct de eindstand.
        </p>
        {placementTeamIds.map((teamId, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 flex-none text-mint-ink-muted">Plek {i + 9}</span>
            <TeamSelect name={`placement${i + 9}`} teams={teams} defaultValue={teamId} />
          </div>
        ))}
      </div>
      <ActionFormError />
      <SaveButton label={published ? "Bijwerken" : "Publiceren"} savedLabel={published ? "Bijgewerkt" : "Gepubliceerd"} />
    </ActionForm>
  );
}

/** Team picker for the Top 8 editor — a <select> of team names beats a hand-typed team id:
 * no way to fat-finger it, and the id/name mapping (teamNameById) becomes unnecessary here. */
function TeamSelect({
  name,
  teams,
  defaultValue,
}: {
  name: string;
  teams: Array<{ id: string; name: string }>;
  defaultValue: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-9 flex-1 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink"
    >
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
