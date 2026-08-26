import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { phaseIndicatorData } from "@/lib/schedule";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { top8RankingFromMatches } from "@/lib/ranking-from-matches";
import { freePlayCourts } from "@/lib/bracket-engine";
import { TvView } from "./tv-view";

export default async function TvPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules, matches] = await Promise.all([repo.listTeams(event.id), repo.listPoules(event.id), repo.listMatches(event.id)]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const indicator = phaseIndicatorData(event, schedule.roundsCount || 1);

  const showCourts = event.status === "poulefase" || event.status.startsWith("finale_ronde_");
  const bracketRound = event.status.startsWith("finale_ronde_") ? (Number(event.status.slice(-1)) as 1 | 2 | 3) : null;
  const currentMatches = showCourts
    ? event.status === "poulefase"
      ? matches.filter((m) => m.phase === "poule" && m.roundNumber === event.currentPouleRound)
      : matches.filter((m) => m.phase !== "poule" && m.roundNumber === bracketRound)
    : [];
  const freeCourts = bracketRound ? freePlayCourts(bracketRound, event.courts) : [];
  const restingTeamNames =
    event.status === "poulefase"
      ? poules.flatMap((p) => schedule.restingTeamIds(event.currentPouleRound, p.label)).map((id) => teamNameById[id] ?? "?")
      : [];

  const pouleStandings = groupStandingsByPoule(poules, matches, event.points).map((p) => ({
    label: p.label,
    rows: p.rows.map((r) => ({ ...r, name: teamNameById[r.teamId] ?? "?" })),
  }));

  const showPodium = event.status === "prijsuitreiking" || event.status === "finished";
  let ranking: Array<{ teamId: string; rank: number }> = [];
  if (event.status === "finished") {
    ranking = (await repo.listPlacements(event.id)).map((p) => ({ teamId: p.teamId, rank: p.finalRank ?? 0 }));
  } else if (showPodium) {
    const top8State = await repo.getTop8(event.id);
    ranking = top8State
      ? [
          ...top8RankingFromMatches(matches, top8State.top8.seeds),
          ...top8State.placementSeeds.map((teamId, i) => ({ teamId, rank: 9 + i })),
        ]
      : [];
  }

  return (
    <TvView
      eventName={event.name}
      indicator={indicator}
      showCourts={showCourts}
      courts={[
        ...currentMatches
          .sort((a, b) => a.courtNumber - b.courtNumber)
          .map((m) => ({
            n: m.courtNumber,
            eyebrow: m.label,
            aName: m.teamAId ? teamNameById[m.teamAId] ?? "?" : "?",
            bName: m.teamBId ? teamNameById[m.teamBId] ?? "?" : "?",
            aScore: m.scoreA,
            bScore: m.scoreB,
            freePlay: false as const,
          })),
        ...freeCourts.map((n) => ({ n, eyebrow: "", aName: "", bName: "", aScore: null, bScore: null, freePlay: true as const })),
      ]}
      restingTeamNames={restingTeamNames}
      pouleStandings={pouleStandings}
      showPodium={showPodium}
      podium={[1, 2, 3].map((rank) => ({
        rank: rank as 1 | 2 | 3,
        name: teamNameById[ranking.find((r) => r.rank === rank)?.teamId ?? ""] ?? "?",
      }))}
      tail={ranking
        .filter((r) => r.rank > 3)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 7)
        .map((r) => ({ rank: r.rank, name: teamNameById[r.teamId] ?? "?" }))}
    />
  );
}
