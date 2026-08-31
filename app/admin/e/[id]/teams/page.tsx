import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { getEventCached } from "@/lib/data/cached";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, SaveButton } from "@/components/admin/action-form";
import { Section } from "@/components/admin/section";
import { addTeamsBulk, deleteTeam, publishPouleMatches, randomizePoules, renameTeam, savePoulesManual, updatePoints } from "../actions";

const POULE_LABEL_OPTIONS = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i)); // A..H

/** Setup: rarely touched once the event is actually running, so it's its own route
 * instead of competing for space with the stepper/phase card on the main Scores page. */
export default async function AdminEventTeamsPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const event = await getEventCached(params.id);
  if (!event) notFound();

  const [teams, poules, matches] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
  ]);
  const pouleMatches = matches.filter((m) => m.phase === "poule");
  const schedulePreview =
    poules.length > 0
      ? generatePouleSchedule(
          poules.map((p) => ({ label: p.label, teamIds: p.teamIds })),
          event.courts
        )
      : null;

  return (
    <>
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
