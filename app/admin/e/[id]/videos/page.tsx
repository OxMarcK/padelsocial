import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { getEventCached } from "@/lib/data/cached";
import { ActionForm, SaveButton } from "@/components/admin/action-form";
import { Section } from "@/components/admin/section";
import { attachVideo } from "../actions";

/** Videos are uploaded and linked after the event, never during it — so this is its own
 * route instead of a section on the Scores page, where it only got in the way under the
 * score entry while the tournament was running. */
export default async function AdminEventVideosPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const event = await getEventCached(params.id);
  if (!event) notFound();

  const [teams, matches] = await Promise.all([repo.listTeams(event.id), repo.listMatches(event.id)]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  // Not-yet-linked matches float to the top — that's the actual to-do here, and the list
  // only grows over the course of an event, so surfacing what's missing beats chronological order.
  const scoredMatches = matches
    .filter((m) => m.scoreA !== null && m.scoreB !== null)
    .sort((a, b) => Number(!!a.videoUrl) - Number(!!b.videoUrl));
  const videosLinkedCount = scoredMatches.filter((m) => m.videoUrl).length;

  if (scoredMatches.length === 0) {
    return (
    <Section title="Video's koppelen" subtitle="Nog geen gespeelde wedstrijden">
      <p className="text-sm text-mint-ink-muted">Na het event koppel je hier per wedstrijd de video.</p>
    </Section>
  );
}

return (
    <Section
      title="Video's koppelen"
      subtitle={`${videosLinkedCount} van ${scoredMatches.length} wedstrijden gekoppeld`}
    >
      <div className="flex flex-col gap-2">
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
            <span className="truncate font-semibold text-[#0E2318]">
              {m.teamAId ? teamNameById[m.teamAId] ?? "?" : "?"} vs {m.teamBId ? teamNameById[m.teamBId] ?? "?" : "?"}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="url"
                name="videoUrl"
                defaultValue={m.videoUrl ?? ""}
                placeholder="https://youtube.com/…"
                className="h-9 min-w-0 flex-1 rounded-lg border border-mint-net/25 bg-white px-2 text-[#0E2318] placeholder:text-mint-ink-muted/60"
              />
              <SaveButton variant="ghost" size="sm" />
            </div>
          </ActionForm>
        ))}
      </div>
    </Section>
  );
}
