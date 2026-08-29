import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { computeSchedule, phaseIndicatorData, type PhaseWindow } from "@/lib/schedule";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { top8RankingFromMatches } from "@/lib/ranking-from-matches";
import { buildMatchVideoRows } from "@/lib/match-video";
import { freePlayCourts } from "@/lib/bracket-engine";
import type { Match, PadelEvent, Team } from "@/lib/types";
import { Logo } from "@/components/logo";
import { EventNav } from "@/components/event-nav";
import { EVENT_NAV_SPACER_CLASS } from "@/lib/event-nav-spacer";
import { LivePoll } from "@/components/live-poll";
// Design 6A trial (light "mint" palette) — see components/mint/. Only this page
// has been redone; standen/teams/homepage still use the original components above.
import { PhaseIndicator } from "@/components/mint/phase-indicator";
import { PhaseTimeline } from "@/components/mint/phase-timeline";
import { CourtCard } from "@/components/mint/court-card";
import { StandingsList } from "@/components/mint/standings-list";
import { Podium } from "@/components/mint/podium";
import { MatchVideoSection } from "@/components/mint/match-video-list";

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

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
        />
        {firstRoundMatches.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h2 className="font-mint text-lg font-bold text-mint-ink">Zo beginnen we</h2>
            <div className="flex flex-col gap-2">
              {firstRoundMatches.map((m) => (
                <div key={m.id} className="rounded-[24px] border border-mint-net/25 bg-mint-surface p-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-mint-lime-ink">{m.label}</span>
                    <span className="text-mint-ink-muted">Baan {m.courtNumber}</span>
                  </div>
                  <div className="mt-1 text-sm text-mint-ink">
                    {teamNameById[m.teamAId ?? ""] ?? "?"} vs {teamNameById[m.teamBId ?? ""] ?? "?"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-mint-ink-muted">Dit event wordt nog opgezet.</p>
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
  const freeCourts = bracketRound ? freePlayCourts(bracketRound, event.courts) : [];
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
  const top8 = top8State ? top8RankingFromMatches(matches, top8State.top8.seeds) : [];
  const placementRanking = top8State ? top8State.placementSeeds.map((teamId, i) => ({ teamId, rank: 9 + i })) : [];

  return (
    <Shell event={event}>
      <LivePoll />
      <PhaseTimeline windows={windows} currentStatus={event.status} />
      <PhaseIndicator
        phaseLabel={indicator.phaseLabel}
        subLabel={indicator.subLabel}
        timeWindowText={indicator.timeWindowText}
        nextLine={indicator.nextLine}
        kind={indicator.kind}
        countdownText={indicator.countdownText}
        progress={indicator.progress}
      />

      {showPodium ? (
        <div className="flex flex-col gap-6">
          <Podium
            entries={[1, 2, 3].map((rank) => {
              const row = top8.find((r) => r.rank === rank);
              return { rank: rank as 1 | 2 | 3, name: row ? teamNameById[row.teamId] ?? "?" : "?" };
            })}
          />
          <div className="text-center text-sm text-mint-ink-muted">Banen zijn vrij — kom naar binnen voor de prijsuitreiking.</div>
          <RankingList rows={[...top8, ...placementRanking]} teamNameById={teamNameById} />
        </div>
      ) : null}

      {showCourts ? (
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
      ) : null}

      {restingTeamIds.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-mint text-lg font-bold text-mint-ink">
            Rust deze ronde <span className="text-sm font-normal text-mint-ink-muted">{restingTeamIds.length} teams</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {restingTeamIds.map((teamId) => (
              <span
                key={teamId}
                className="flex items-center gap-1.5 rounded-full border border-mint-net/30 bg-mint-surface px-3 py-1.5 text-sm text-mint-ink"
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
          <h2 className="font-mint text-lg font-bold text-mint-ink">Live stand</h2>
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
  slug,
}: {
  rows: { teamId: string; rank: number }[];
  teamNameById: Record<string, string>;
  slug?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-mint-net/25 bg-mint-surface">
      {rows
        .sort((a, b) => a.rank - b.rank)
        .map((r) => {
          const row = (
            <div className="flex items-center gap-3 border-b border-mint-net/20 px-4 py-2.5 last:border-b-0">
              <span className="w-8 font-mint text-xl font-bold tabular-nums text-mint-ink-muted">{r.rank}</span>
              <span className="flex-1 truncate text-sm font-medium text-mint-ink">{teamNameById[r.teamId] ?? "?"}</span>
            </div>
          );
          return slug ? (
            <Link key={r.teamId} href={`/${slug}/teams/${r.teamId}`} prefetch={false}>
              {row}
            </Link>
          ) : (
            <div key={r.teamId}>{row}</div>
          );
        })}
    </div>
  );
}

// Design 6A trial: light "mint" gradient background + Plus Jakarta Sans, applied only
// to this page (see components/mint/ for the matching component restyles). The
// gradient is painted directly on <main> — opaque and min-h-screen — so it fully
// covers the dark noise texture from the root layout's <body> for this route.
// Per the 6A canvas: the header sits on its own solid white bar — logo and title
// aren't floating directly on the gradient — while everything else keeps the mint
// background. Sticky so it stays put while scrolling, matching the reference.
function Shell({ children, event }: { children: React.ReactNode; event?: PadelEvent }) {
  return (
    <div
      className={`min-h-screen font-mint text-mint-ink ${EVENT_NAV_SPACER_CLASS}`}
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Logo variant="light" />
          {event ? <h1 className="min-w-0 truncate font-mint text-2xl font-bold text-mint-ink">{event.name}</h1> : null}
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">{children}</main>
    </div>
  );
}

async function ResultsView({
  event,
  teams,
  matches,
  teamNameById,
  windows,
}: {
  event: NonNullable<Awaited<ReturnType<typeof repo.getEventBySlug>>>;
  teams: Team[];
  matches: Match[];
  teamNameById: Record<string, string>;
  windows: PhaseWindow[];
}) {
  const placements = await repo.listPlacements(event.id);
  const byRank = [...placements].sort((a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999));
  const top8 = byRank.filter((p) => (p.finalRank ?? 99) <= 8);
  const rest = byRank.filter((p) => (p.finalRank ?? 99) > 8);
  const videoRows = buildMatchVideoRows(matches, {
    teamNameById,
    pouleStartsAt: windows.find((w) => w.status === "poulefase")!.startsAt,
    windows,
  });

  return (
    <Shell event={event}>
      <div>
        <h2 className="font-mint text-4xl font-bold text-mint-ink">Eindstand</h2>
        <p className="text-sm text-mint-ink-muted">
          {event.name} · {event.date} · {teams.length} teams
        </p>
      </div>

      <Podium
        entries={[1, 2, 3].map((rank) => ({
          rank: rank as 1 | 2 | 3,
          name: teamNameById[top8.find((p) => p.finalRank === rank)?.teamId ?? ""] ?? "?",
        }))}
      />

      <Section title="Top 8">
        <RankingList rows={top8.map((p) => ({ teamId: p.teamId, rank: p.finalRank ?? 0 }))} teamNameById={teamNameById} slug={event.slug} />
      </Section>

      <Section title="Overige teams · 9e en verder">
        <RankingList rows={rest.map((p) => ({ teamId: p.teamId, rank: p.finalRank ?? 0 }))} teamNameById={teamNameById} slug={event.slug} />
      </Section>

      <p className="text-center text-xs text-mint-ink-muted">Tik op een team voor de kaart en de deelknop.</p>

      <MatchVideoSection title="Video's" rows={videoRows} />
      <EventNav slug={event.slug} active="event" />
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-mint text-lg font-bold text-mint-ink">{title}</h2>
      {children}
    </section>
  );
}
