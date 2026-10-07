import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { top8RankingFromMatches } from "@/lib/ranking-from-matches";
import { EventNav } from "@/components/mint/event-nav";
import { EventShell } from "@/components/mint/event-shell";
import { TeamSearchGrid } from "./team-search-grid";

export default async function TeamsPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules, matches, placements, top8State] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
    repo.listPlacements(event.id),
    repo.getTop8(event.id),
  ]);
  const pouleByTeam = new Map<string, string>();
  for (const poule of poules) for (const teamId of poule.teamIds) pouleByTeam.set(teamId, poule.label);

  // Final rank (1-8 from the resolved bracket, 9+ from the placement track) —
  // same source the Teams tab and the results page's Top 8/Overig lists use.
  const finalRankById = new Map<string, number>();
  for (const p of placements) if (p.finalRank !== null) finalRankById.set(p.teamId, p.finalRank);
  if (top8State) {
    const ranking = [
      ...top8RankingFromMatches(matches, top8State.top8.seeds),
      ...top8State.placementSeeds.map((teamId, i) => ({ teamId, rank: 9 + i })),
    ];
    for (const r of ranking) if (!finalRankById.has(r.teamId)) finalRankById.set(r.teamId, r.rank);
  }

  return (
    <EventShell title="Teams">
      <TeamSearchGrid
        slug={event.slug}
        teams={teams.map((t) => ({
          id: t.id,
          name: t.name,
          pouleLabel: pouleByTeam.get(t.id) ?? null,
          player1Name: t.player1.name,
          player2Name: t.player2.name,
          finalRank: finalRankById.get(t.id) ?? null,
        }))}
      />
      <EventNav slug={event.slug} active="teams" />
    </EventShell>
  );
}
