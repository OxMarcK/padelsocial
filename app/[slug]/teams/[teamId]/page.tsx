import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { top8RankingFromMatches } from "@/lib/ranking-from-matches";
import { computeSchedule, fmtTime, pouleRoundWindow } from "@/lib/schedule";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { buildMatchVideoRows } from "@/lib/match-video";
import { buildTeamSlugMap, resolveTeamBySlugOrId } from "@/lib/team-slug";
import { TeamResultCard } from "@/components/mint/team-result-card";
import { MatchVideoSection } from "@/components/mint/match-video-list";
import { EventNav } from "@/components/mint/event-nav";
import { EventShell } from "@/components/mint/event-shell";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";

export default async function TeamDetailPage({ params }: { params: { slug: string; teamId: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules, matches, placements, top8State] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
    repo.listPlacements(event.id),
    repo.getTop8(event.id),
  ]);
  const team = resolveTeamBySlugOrId(teams, params.teamId);
  if (!team) notFound();

  const poule = poules.find((p) => p.teamIds.includes(team.id));
  const standings = poule ? groupStandingsByPoule([poule], matches, event.points) : [];
  const pouleRows = standings[0]?.rows ?? [];
  const pouleRank = pouleRows.findIndex((r) => r.teamId === team.id) + 1;
  const myRow = pouleRows.find((r) => r.teamId === team.id);

  let finalRank: number | null = placements.find((p) => p.teamId === team.id)?.finalRank ?? null;
  if (finalRank === null && top8State) {
    const ranking = [
      ...top8RankingFromMatches(matches, top8State.top8),
      ...top8State.placementSeeds.map((teamId, i) => ({ teamId, rank: 9 + i })),
    ];
    finalRank = ranking.find((r) => r.teamId === team.id)?.rank ?? null;
  }

  const teamSlug = buildTeamSlugMap(teams).get(team.id) ?? team.id;
  const host = headers().get("host");
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const shareUrl = host ? `${proto}://${host}/${event.slug}/teams/${teamSlug}` : `/${event.slug}/teams/${teamSlug}`;

  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const pouleMatches = matches
    .filter((m) => m.phase === "poule" && (m.teamAId === team.id || m.teamBId === team.id))
    .sort((a, b) => a.roundNumber - b.roundNumber);
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const windows = computeSchedule(event, schedule.roundsCount || 1);
  const pouleWindow = windows.find((w) => w.status === "poulefase")!;

  const videoRows = buildMatchVideoRows(
    matches.filter((m) => m.teamAId === team.id || m.teamBId === team.id),
    {
      teamNameById,
      pouleStartsAt: pouleWindow.startsAt,
      pouleChangeoverMinutes: event.schedule.pouleChangeoverMinutes,
      windows,
      perspectiveTeamId: team.id,
    }
  );

  return (
    <EventShell title="Team" width="sm">
      <TeamResultCard
        slug={event.slug}
        teamId={team.id}
        teamName={team.name}
        player1Name={team.player1.name}
        player2Name={team.player2.name}
        finalRank={finalRank ?? 0}
        totalTeams={teams.length}
        pouleLabel={poule?.label ?? "?"}
        pouleRank={pouleRank || 0}
        wins={myRow?.won ?? 0}
        losses={myRow?.lost ?? 0}
        shareUrl={shareUrl}
      />

      {pouleMatches.length > 0 && event.status !== "finished" ? (
        <section className="flex flex-col gap-2">
          <Heading>Poulewedstrijden</Heading>
          <div className="flex flex-col gap-2">
            {pouleMatches.map((m) => {
              const opp = m.teamAId === team.id ? m.teamBId : m.teamAId;
              const myScore = m.teamAId === team.id ? m.scoreA : m.scoreB;
              const oppScore = m.teamAId === team.id ? m.scoreB : m.scoreA;
              const played = myScore !== null && oppScore !== null;
              const { startsAt, endsAt } = pouleRoundWindow(pouleWindow.startsAt, m.roundNumber, event.schedule.pouleChangeoverMinutes);
              return (
                <Card key={m.id} className="flex items-center gap-3 p-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-mint-lime-ink">
                        Ronde {m.roundNumber} · Baan {m.courtNumber}
                      </span>
                      <span className="tabular-nums text-mint-ink-muted">
                        {fmtTime(startsAt)}–{fmtTime(endsAt)}
                      </span>
                    </div>
                    <div className="truncate text-base font-bold text-mint-ink">
                      <span className="font-semibold text-mint-ink-muted">vs</span> {opp ? teamNameById[opp] ?? "?" : "?"}
                    </div>
                  </div>
                  <span
                    className={`flex-none font-mint text-2xl font-extrabold tabular-nums ${
                      played && myScore! > oppScore! ? "text-mint-lime-ink" : played ? "text-mint-ink" : "text-mint-ink-muted"
                    }`}
                  >
                    {played ? `${myScore}-${oppScore}` : "–"}
                  </span>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <MatchVideoSection title="Video's" rows={videoRows} size="section" />

      <EventNav slug={event.slug} />
    </EventShell>
  );
}
