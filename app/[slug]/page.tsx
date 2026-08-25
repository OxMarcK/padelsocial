import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { computeSchedule, phaseIndicatorData } from "@/lib/schedule";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { top8RankingFromMatches, placementRankingFromMatches } from "@/lib/ranking-from-matches";
import type { Match, PadelEvent, Team } from "@/lib/types";
import { Logo } from "@/components/logo";
import { PhaseIndicator } from "@/components/phase-indicator";
import { PhaseTimeline } from "@/components/phase-timeline";
import { CourtCard } from "@/components/court-card";
import { StandingsList } from "@/components/standings-list";
import { Podium } from "@/components/podium";
import { LivePoll } from "@/components/live-poll";

function fmtEventDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules, matches] = await Promise.all([repo.listTeams(event.id), repo.listPoules(event.id), repo.listMatches(event.id)]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
  const indicator = phaseIndicatorData(event, schedule.roundsCount || 1);
  const windows = computeSchedule(event, schedule.roundsCount || 1);

  if (event.status === "finished") {
    return <ResultsView event={event} teams={teams} matches={matches} teamNameById={teamNameById} />;
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
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">Zo beginnen we</h2>
            <div className="flex flex-col gap-2">
              {firstRoundMatches.map((m) => (
                <div key={m.id} className="rounded-2xl border border-flood-white/10 bg-surface p-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-lime-serve">{m.label}</span>
                    <span className="text-ink-muted">Baan {m.courtNumber}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    {teamNameById[m.teamAId ?? ""] ?? "?"} vs {teamNameById[m.teamBId ?? ""] ?? "?"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-ink-muted">Dit event wordt nog opgezet.</p>
        )}
      </Shell>
    );
  }

  const showCourts = event.status === "poulefase" || event.status.startsWith("finale_ronde_");
  const currentMatches = showCourts
    ? event.status === "poulefase"
      ? matches.filter((m) => m.phase === "poule" && m.roundNumber === event.currentPouleRound)
      : matches.filter((m) => m.phase !== "poule" && m.roundNumber === Number(event.status.slice(-1)))
    : [];
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
  const top8 = showPodium ? top8RankingFromMatches(matches) : [];
  const top8State = showPodium ? await repo.getTop8(event.id) : null;
  const placementRanking = showPodium && top8State ? placementRankingFromMatches(matches, top8State.placementSeeds) : [];

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
          <div className="text-center text-sm text-ink-muted">Banen zijn vrij — kom naar binnen voor de prijsuitreiking.</div>
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
        </div>
      ) : null}

      {restingTeamIds.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Rust deze ronde <span className="text-sm normal-case tracking-normal text-ink-muted">{restingTeamIds.length} teams</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {restingTeamIds.map((teamId) => (
              <span
                key={teamId}
                className="flex items-center gap-1.5 rounded-full border border-flood-white/15 px-3 py-1.5 text-sm"
              >
                <span className="rounded bg-net-grey px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-court-night">
                  RUST
                </span>
                {teamNameById[teamId] ?? "?"}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showCourts ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">Live stand</h2>
          <StandingsList
            rows={combinedRows.map((r) => ({ teamId: r.teamId, name: r.name, points: r.points, pouleLabel: r.pouleLabel }))}
          />
        </div>
      ) : null}

      <nav className="flex gap-3 text-sm">
        <Link href={`/${event.slug}/standen`} className="underline">
          Standen
        </Link>
        <Link href={`/${event.slug}/teams`} className="underline">
          Teams
        </Link>
        <Link href={`/${event.slug}/tv`} className="underline">
          TV-modus
        </Link>
      </nav>
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
    <div className="overflow-hidden rounded-2xl border border-flood-white/10 bg-surface">
      {rows
        .sort((a, b) => a.rank - b.rank)
        .map((r) => {
          const row = (
            <div className="flex items-center gap-3 border-b border-net-grey/20 px-4 py-2.5 last:border-b-0">
              <span className="w-8 font-display text-xl font-bold tabular-nums text-ink-muted">{r.rank}</span>
              <span className="flex-1 truncate text-sm font-medium">{teamNameById[r.teamId] ?? "?"}</span>
            </div>
          );
          return slug ? (
            <Link key={r.teamId} href={`/${slug}/teams/${r.teamId}`}>
              {row}
            </Link>
          ) : (
            <div key={r.teamId}>{row}</div>
          );
        })}
    </div>
  );
}

function Shell({ children, event }: { children: React.ReactNode; event?: PadelEvent }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8">
      <div className="flex items-center justify-between gap-3">
        <Logo />
        {event ? (
          <span className="text-sm text-ink-muted">
            {fmtEventDate(event.date)} · {event.location}
          </span>
        ) : null}
      </div>
      {children}
    </main>
  );
}

async function ResultsView({
  event,
  teams,
  matches,
  teamNameById,
}: {
  event: NonNullable<Awaited<ReturnType<typeof repo.getEventBySlug>>>;
  teams: Team[];
  matches: Match[];
  teamNameById: Record<string, string>;
}) {
  const placements = await repo.listPlacements(event.id);
  const byRank = [...placements].sort((a, b) => (a.finalRank ?? 999) - (b.finalRank ?? 999));
  const top8 = byRank.filter((p) => (p.finalRank ?? 99) <= 8);
  const rest = byRank.filter((p) => (p.finalRank ?? 99) > 8);

  return (
    <Shell>
      <div>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">Eindstand</h1>
        <p className="text-sm text-ink-muted">
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

      <p className="text-center text-xs text-ink-muted">Tik op een team voor de kaart en de deelknop.</p>

      <Section title="Video's">
        {matches.filter((m) => m.videoUrl).length === 0 ? (
          <p className="text-sm text-ink-muted">Nog geen video&apos;s gekoppeld.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {matches
              .filter((m) => m.videoUrl)
              .map((m) => (
                <a
                  key={m.id}
                  href={m.videoUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-surface px-4 py-3 text-sm underline"
                >
                  {m.label} — Bekijk jouw wedstrijd terug
                </a>
              ))}
          </div>
        )}
      </Section>
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}
