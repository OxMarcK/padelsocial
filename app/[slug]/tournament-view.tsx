import Link from "next/link";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { computeSchedule, phaseIndicatorData, type PhaseWindow } from "@/lib/schedule";
import { generatePouleSchedule, playedCourts } from "@/lib/poule-scheduler";
import { top8RankingFromMatches } from "@/lib/ranking-from-matches";
import { buildMatchVideoRows } from "@/lib/match-video";
import { freePlayCourts } from "@/lib/bracket-engine";
import { buildTeamSlugMap } from "@/lib/team-slug";
import { computeTournamentStats, formatPodiumCaption } from "@/lib/tournament-stats";
import type { Match, PadelEvent, Team } from "@/lib/types";
import { EventNav } from "@/components/mint/event-nav";
import { LivePoll } from "@/components/live-poll";
import { PhaseIndicator } from "@/components/mint/phase-indicator";
import { PhaseTimeline } from "@/components/mint/phase-timeline";
import { CourtCard } from "@/components/mint/court-card";
import { StandingsList } from "@/components/mint/standings-list";
import { Podium } from "@/components/mint/podium";
import { MatchVideoSection } from "@/components/mint/match-video-list";
import { EventShell } from "@/components/mint/event-shell";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { fmtDateLong } from "@/lib/share-metadata";

/** The tournament half of the /{slug} dispatcher (see app/[slug]/page.tsx) — takes
 * the already-looked-up event rather than re-fetching by slug, since the dispatcher
 * needs that lookup anyway to decide tournament vs. session. */
export async function TournamentEventPage({ event }: { event: PadelEvent }) {
  const [teams, poules, matches] = await Promise.all([repo.listTeams(event.id), repo.listPoules(event.id), repo.listMatches(event.id)]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const indicator = phaseIndicatorData(event, schedule.roundsCount || 1);
  const windows = computeSchedule(event, schedule.roundsCount || 1);

  if (event.status === "finished") {
    return <ResultsView event={event} teams={teams} matches={matches} teamNameById={teamNameById} windows={windows} />;
  }

  if (event.status === "draft") {
    const firstRoundMatches = matches
      .filter((m) => m.phase === "poule" && m.roundNumber === 1)
      .sort((a, b) => a.courtNumber - b.courtNumber);
    return (
      <Shell event={event}>
        <PhaseTimeline windows={windows} currentStatus={event.status} />
        <PhaseIndicator
          phaseLabel={indicator.phaseLabel}
          subLabel={indicator.subLabel}
          timeWindowText={indicator.timeWindowText}
          nextLine={indicator.nextLine}
          kind={indicator.kind}
          countdownText={indicator.countdownText}
          progress={indicator.progress}
          countdownStartsAt={indicator.countdownStartsAt}
          countdownEndsAt={indicator.countdownEndsAt}
        />
        {firstRoundMatches.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Heading size="sub">Zo beginnen we</Heading>
            <div className="flex flex-col gap-2">
              {firstRoundMatches.map((m) => (
                <Card key={m.id} className="p-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-mint-lime-ink">{m.label}</span>
                    <span className="text-mint-ink-muted">Baan {m.courtNumber}</span>
                  </div>
                  <div className="mt-1 text-base font-bold text-mint-ink">
                    {teamNameById[m.teamAId ?? ""] ?? "?"} vs {teamNameById[m.teamBId ?? ""] ?? "?"}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-medium text-mint-ink-muted">Dit event wordt nog opgezet.</p>
        )}
        <EventNav slug={event.slug} active="event" />
      </Shell>
    );
  }

  const showCourts = event.status === "poulefase" || event.status.startsWith("finale_ronde_");
  const bracketRound = event.status.startsWith("finale_ronde_") ? (Number(event.status.slice(-1)) as 1 | 2 | 3) : null;
  const currentMatches = showCourts
    ? event.status === "poulefase"
      ? matches.filter((m) => m.phase === "poule" && m.roundNumber === event.currentPouleRound)
      : matches.filter((m) => m.phase !== "poule" && m.roundNumber === bracketRound)
    : [];
  const freeCourts = bracketRound ? freePlayCourts(bracketRound, event.courts, playedCourts(schedule, event.courts)) : [];
  const restingTeamIds =
    event.status === "poulefase" ? poules.flatMap((p) => schedule.restingTeamIds(event.currentPouleRound, p.label)) : [];

  const pouleStandings = groupStandingsByPoule(poules, matches, event.points).map((p) => ({
    ...p,
    rows: p.rows.map((r) => ({ ...r, name: teamNameById[r.teamId] ?? "?" })),
  }));
  const combinedRows = pouleStandings
    .flatMap((p) => p.rows.map((r) => ({ ...r, pouleLabel: p.label })))
    .sort((a, b) => b.points - a.points || b.saldo - a.saldo || b.gamesFor - a.gamesFor);

  const showPodium = event.status === "prijsuitreiking";
  const top8State = showPodium ? await repo.getTop8(event.id) : null;
  const top8 = top8State ? top8RankingFromMatches(matches, top8State.top8) : [];
  const placementRanking = top8State ? top8State.placementSeeds.map((teamId, i) => ({ teamId, rank: 9 + i })) : [];

  return (
    <Shell event={event}>
      <LivePoll />
      <PhaseTimeline windows={windows} currentStatus={event.status} />
      {/* Bij de prijsuitreiking zegt het podium alles al; de fasekaart erboven is dan alleen ruis. */}
      {showPodium ? null : (
        <PhaseIndicator
          phaseLabel={indicator.phaseLabel}
          subLabel={indicator.subLabel}
          timeWindowText={indicator.timeWindowText}
          nextLine={indicator.nextLine}
          kind={indicator.kind}
          countdownText={indicator.countdownText}
          progress={indicator.progress}
          countdownStartsAt={indicator.countdownStartsAt}
          countdownEndsAt={indicator.countdownEndsAt}
        />
      )}

      {showPodium ? (
        <div className="flex flex-col gap-6">
          <Podium
            entries={[1, 2, 3].map((rank) => {
              const row = top8.find((r) => r.rank === rank);
              return { rank: rank as 1 | 2 | 3, name: row ? teamNameById[row.teamId] ?? "?" : "?" };
            })}
            caption="Banen zijn vrij — kom naar binnen voor de prijsuitreiking."
          />
          <RankingList rows={[...top8, ...placementRanking]} teamNameById={teamNameById} />
        </div>
      ) : null}

      {showCourts ? (
        <div className="flex flex-col gap-4">
          <Heading>Nu op de baan</Heading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {currentMatches
              .sort((a, b) => a.courtNumber - b.courtNumber)
              .map((m) => (
                <CourtCard
                  key={m.id}
                  courtNumber={m.courtNumber}
                  eyebrow={m.label}
                  teamA={{ name: m.teamAId ? teamNameById[m.teamAId] ?? "?" : "?", score: m.scoreA, winning: won(m, "A") }}
                  teamB={{ name: m.teamBId ? teamNameById[m.teamBId] ?? "?" : "?", score: m.scoreB, winning: won(m, "B") }}
                />
              ))}
            {freeCourts.map((court) => (
              <CourtCard key={`free-${court}`} courtNumber={court} freePlay />
            ))}
          </div>
        </div>
      ) : null}

      {restingTeamIds.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Heading size="sub">
            Rust deze ronde <span className="text-sm font-semibold tracking-normal text-mint-ink-muted">{restingTeamIds.length} teams</span>
          </Heading>
          <div className="flex flex-wrap gap-2">
            {restingTeamIds.map((teamId) => (
              <span
                key={teamId}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-mint-ink shadow-pill"
              >
                <span className="rounded-full bg-mint-net/60 px-1.5 py-0.5 font-mint text-[10px] font-bold text-white">RUST</span>
                {teamNameById[teamId] ?? "?"}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showCourts ? (
        <div className="flex flex-col gap-2">
          <Heading>Live stand</Heading>
          <StandingsList
            rows={combinedRows.map((r) => ({
              teamId: r.teamId,
              name: r.name,
              points: r.points,
              saldo: r.saldo,
              pouleLabel: r.pouleLabel,
              resting: restingTeamIds.includes(r.teamId),
            }))}
          />
        </div>
      ) : null}
      <EventNav slug={event.slug} active="event" />
    </Shell>
  );
}

function won(m: Match, side: "A" | "B") {
  if (m.scoreA === null || m.scoreB === null) return false;
  return side === "A" ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
}

function RankingList({
  rows,
  teamNameById,
  teamSlugById,
  slug,
}: {
  rows: { teamId: string; rank: number }[];
  teamNameById: Record<string, string>;
  teamSlugById?: Record<string, string>;
  slug?: string;
}) {
  return (
    <Card className="flex flex-col gap-1 p-1">
      {rows
        .sort((a, b) => a.rank - b.rank)
        .map((r) => {
          const row = (
            <div className="flex items-center gap-3 rounded-[14px] px-2 py-2.5">
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-mint text-lg font-extrabold tabular-nums ${
                  r.rank <= 3 ? "bg-mint-lime text-mint-lime-ink" : "bg-mint-lime/15 text-mint-ink-muted"
                }`}
              >
                {r.rank}
              </span>
              <span className="flex-1 truncate text-base font-semibold text-mint-ink">{teamNameById[r.teamId] ?? "?"}</span>
            </div>
          );
          return slug ? (
            <Link key={r.teamId} href={`/${slug}/teams/${teamSlugById?.[r.teamId] ?? r.teamId}`} prefetch={false}>
              {row}
            </Link>
          ) : (
            <div key={r.teamId}>{row}</div>
          );
        })}
    </Card>
  );
}

/** Header title per state: the event's name until it starts, "Live" while it runs, "Eindstand" after (passed explicitly). */
function Shell({ children, event, headerLabel }: { children: React.ReactNode; event: PadelEvent; headerLabel?: string }) {
  return <EventShell title={headerLabel ?? (event.status === "draft" ? "Toernooi" : "Live")}>{children}</EventShell>;
}

async function ResultsView({
  event,
  teams,
  matches,
  teamNameById,
  windows,
}: {
  event: PadelEvent;
  teams: Team[];
  matches: Match[];
  teamNameById: Record<string, string>;
  windows: PhaseWindow[];
}) {
  const placements = await repo.listPlacements(event.id);
  const teamSlugById = Object.fromEntries(buildTeamSlugMap(teams));
  const byRank = [...placements].sort((a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999));
  const top8 = byRank.filter((p) => (p.finalRank ?? 99) <= 8);
  const rest = byRank.filter((p) => (p.finalRank ?? 99) > 8);
  const videoRows = buildMatchVideoRows(matches, {
    teamNameById,
    pouleStartsAt: windows.find((w) => w.status === "poulefase")!.startsAt,
    pouleChangeoverMinutes: event.schedule.pouleChangeoverMinutes,
    windows,
  });

  return (
    <Shell event={event} headerLabel="Eindstand">
      <div>
        <Heading size="display">{event.name}</Heading>
        <p className="mt-1 text-sm font-medium text-mint-ink-muted">
          {fmtDateLong(event.date)} · {teams.length} teams
        </p>
      </div>

      <Podium
        entries={[1, 2, 3].map((rank) => ({
          rank: rank as 1 | 2 | 3,
          name: teamNameById[top8.find((p) => p.finalRank === rank)?.teamId ?? ""] ?? "?",
        }))}
        caption={formatPodiumCaption(computeTournamentStats(matches, teamNameById))}
      />

      <Section title="Top 8">
        <RankingList
          rows={top8.map((p) => ({ teamId: p.teamId, rank: p.finalRank ?? 0 }))}
          teamNameById={teamNameById}
          teamSlugById={teamSlugById}
          slug={event.slug}
        />
      </Section>

      <Section title="Overige teams · 9e en verder">
        <RankingList
          rows={rest.map((p) => ({ teamId: p.teamId, rank: p.finalRank ?? 0 }))}
          teamNameById={teamNameById}
          teamSlugById={teamSlugById}
          slug={event.slug}
        />
      </Section>

      <p className="text-center text-xs font-medium text-mint-ink-muted">Tik op een team voor de kaart en de deelknop.</p>

      <MatchVideoSection title="Video's" rows={videoRows} />
      <EventNav slug={event.slug} active="event" />
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <Heading size="sub">{title}</Heading>
      {children}
    </section>
  );
}
