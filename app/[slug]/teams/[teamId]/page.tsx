import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { top8RankingFromMatches, placementRankingFromMatches } from "@/lib/ranking-from-matches";
import { TeamResultCard } from "@/components/team-result-card";
import { Logo } from "@/components/logo";

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
  const team = teams.find((t) => t.id === params.teamId);
  if (!team) notFound();

  const poule = poules.find((p) => p.teamIds.includes(team.id));
  const standings = poule ? groupStandingsByPoule([poule], matches, event.points) : [];
  const pouleRows = standings[0]?.rows ?? [];
  const pouleRank = pouleRows.findIndex((r) => r.teamId === team.id) + 1;
  const myRow = pouleRows.find((r) => r.teamId === team.id);

  let finalRank: number | null = placements.find((p) => p.teamId === team.id)?.finalRank ?? null;
  if (finalRank === null && top8State) {
    const ranking = [...top8RankingFromMatches(matches), ...placementRankingFromMatches(matches, top8State.placementSeeds)];
    finalRank = ranking.find((r) => r.teamId === team.id)?.rank ?? null;
  }

  const host = headers().get("host");
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const shareUrl = host ? `${proto}://${host}/${event.slug}/teams/${team.id}` : `/${event.slug}/teams/${team.id}`;

  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const pouleMatches = matches.filter((m) => m.phase === "poule" && (m.teamAId === team.id || m.teamBId === team.id));
  const bracketMatches = matches.filter((m) => m.phase !== "poule" && (m.teamAId === team.id || m.teamBId === team.id));

  const summaryParts: string[] = [];
  if (poule && myRow) summaryParts.push(`Poule ${poule.label}: ${myRow.won}-${myRow.drawn}-${myRow.lost}, ${myRow.points} punten.`);
  const lastBracket = bracketMatches[bracketMatches.length - 1];
  if (lastBracket && lastBracket.scoreA !== null && lastBracket.scoreB !== null) {
    const opp = lastBracket.teamAId === team.id ? lastBracket.teamBId : lastBracket.teamAId;
    summaryParts.push(`${lastBracket.label} tegen ${opp ? teamNameById[opp] ?? "?" : "?"} (${lastBracket.scoreA}-${lastBracket.scoreB}).`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-8">
      <Logo />
      <Link href={`/${event.slug}`} className="text-sm underline">
        &larr; Terug naar {event.name}
      </Link>
      <TeamResultCard
        teamName={team.name}
        finalRank={finalRank ?? 0}
        totalTeams={teams.length}
        pouleLabel={poule?.label ?? "?"}
        pouleRank={pouleRank || 0}
        wins={myRow?.won ?? 0}
        losses={myRow?.lost ?? 0}
        summary={summaryParts.join(" ") || "De wedstrijden van dit team staan hier zodra ze gespeeld zijn."}
        shareUrl={shareUrl}
      />

      {pouleMatches.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">Poulewedstrijden</h2>
          <div className="flex flex-col gap-1.5">
            {pouleMatches.map((m) => {
              const opp = m.teamAId === team.id ? m.teamBId : m.teamAId;
              const myScore = m.teamAId === team.id ? m.scoreA : m.scoreB;
              const oppScore = m.teamAId === team.id ? m.scoreB : m.scoreA;
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm">
                  <span className="truncate">{opp ? teamNameById[opp] ?? "?" : "?"}</span>
                  <span className="tabular-nums text-ink-muted">{myScore !== null ? `${myScore}-${oppScore}` : "–"}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
