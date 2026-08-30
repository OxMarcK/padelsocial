import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { top8RankingFromMatches } from "@/lib/ranking-from-matches";
import { computeSchedule, fmtTime, pouleRoundWindow } from "@/lib/schedule";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { buildMatchVideoRows } from "@/lib/match-video";
import { TeamResultCard } from "@/components/mint/team-result-card";
import { MatchVideoSection } from "@/components/mint/match-video-list";
import { Logo } from "@/components/logo";
import { EventNav } from "@/components/mint/event-nav";
import { EVENT_NAV_SPACER_CLASS } from "@/lib/event-nav-spacer";

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
    const ranking = [
      ...top8RankingFromMatches(matches, top8State.top8.seeds),
      ...top8State.placementSeeds.map((teamId, i) => ({ teamId, rank: 9 + i })),
    ];
    finalRank = ranking.find((r) => r.teamId === team.id)?.rank ?? null;
  }

  const host = headers().get("host");
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const shareUrl = host ? `${proto}://${host}/${event.slug}/teams/${team.id}` : `/${event.slug}/teams/${team.id}`;

  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const pouleMatches = matches
    .filter((m) => m.phase === "poule" && (m.teamAId === team.id || m.teamBId === team.id))
    .sort((a, b) => a.roundNumber - b.roundNumber);
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const windows = computeSchedule(event, schedule.roundsCount || 1);
  const pouleWindow = windows.find((w) => w.status === "poulefase")!;

  const videoRows = buildMatchVideoRows(
    matches.filter((m) => m.teamAId === team.id || m.teamBId === team.id),
    { teamNameById, pouleStartsAt: pouleWindow.startsAt, windows, perspectiveTeamId: team.id }
  );

  return (
    <div
      className={`min-h-screen font-mint text-mint-ink ${EVENT_NAV_SPACER_CLASS}`}
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-4">
          <Logo variant="light" />
          <h1 className="font-mint text-2xl font-bold text-mint-ink">Team</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
      <Link
        href={`/${event.slug}/teams`}
        className="inline-flex w-fit items-center gap-1.5 font-mint text-sm font-bold text-mint-ink-muted hover:text-mint-ink"
      >
        <span aria-hidden>&lt;</span> Teams
      </Link>
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
          <h2 className="font-mint text-lg font-bold text-mint-ink">Poule Schema</h2>
          <div className="flex flex-col gap-1.5">
            {pouleMatches.map((m) => {
              const opp = m.teamAId === team.id ? m.teamBId : m.teamAId;
              const myScore = m.teamAId === team.id ? m.scoreA : m.scoreB;
              const oppScore = m.teamAId === team.id ? m.scoreB : m.scoreA;
              const { startsAt, endsAt } = pouleRoundWindow(pouleWindow.startsAt, m.roundNumber);
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-[0_1px_3px_rgba(20,35,28,.08)]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-mint-ink-muted">
                      Ronde {m.roundNumber} · Baan {m.courtNumber} · {fmtTime(startsAt)}–{fmtTime(endsAt)}
                    </span>
                    <span className="truncate text-mint-ink">{opp ? teamNameById[opp] ?? "?" : "?"}</span>
                  </div>
                  <span className="tabular-nums text-mint-ink-muted">{myScore !== null ? `${myScore}-${oppScore}` : "–"}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <MatchVideoSection title="Wedstrijden" rows={videoRows} />

      <EventNav slug={event.slug} active="teams" />
      </main>
    </div>
  );
}
