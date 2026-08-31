import { repo } from "@/lib/data";
import { ActionForm, ActionFormError, SaveButton } from "@/components/admin/action-form";
import { publishTop8Override } from "@/app/admin/e/[id]/actions";

export async function Top8Editor({
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
