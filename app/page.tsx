import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/data";
import { groupStandingsByPoule, sortStandings } from "@/lib/standings";
import type { PadelEvent, PouleStandingRow } from "@/lib/types";
import { Logo } from "@/components/logo";

const OG_DESCRIPTION = "Volg live de standen, je baanindeling en de knock-out.";

/** Whole calendar days from today to `date` — can be negative if the event already started. */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Any event that isn't finished yet is "upcoming" — including one still in
 * "draft" (Inchecken), regardless of how far out its date is. People should
 * be able to find the event and its schedule as soon as it exists, not only
 * once its own morning arrives (previously drafts were hidden entirely,
 * which also made a live event vanish from the landing page right when
 * people were arriving and looking for it).
 */
function isPubliclyVisible(e: PadelEvent): boolean {
  return e.status !== "finished";
}

function fmtEventDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

/** Short date for share-card titles, e.g. "zo 30 aug, 10:30". */
function fmtEventDateShort(date: string, startTime: string): string {
  const short = new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${short}, ${startTime}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const events = await repo.listEvents();
  const upcoming = events.find(isPubliclyVisible);
  const title = upcoming ? `${upcoming.name} - ${fmtEventDateShort(upcoming.date, upcoming.startTime)}` : "Padel Social";

  // Next merges `openGraph`/`twitter` shallowly against the root layout's metadata —
  // returning just {title, description} here would silently drop the image/card-type
  // set there, so restate them explicitly.
  const OG_IMAGE = "/social/padel-social-og-thumb-whatsapp.png";
  return {
    title,
    description: OG_DESCRIPTION,
    openGraph: { title, description: OG_DESCRIPTION, images: [OG_IMAGE], locale: "nl_NL", type: "website" },
    twitter: { card: "summary_large_image", title, description: OG_DESCRIPTION, images: [OG_IMAGE] },
  };
}

function countdownLabel(days: number): string {
  if (days <= 0) return "Vandaag";
  if (days === 1) return "Morgen";
  return `Over ${days} dagen`;
}

export default async function LandingPage() {
  const events = await repo.listEvents();
  const upcoming = events.find(isPubliclyVisible);
  const past = events.filter((e) => e.status === "finished");

  const pastWithTeamCounts = await Promise.all(
    past.map(async (e) => ({ event: e, teamCount: (await repo.listTeams(e.id)).length }))
  );

  // Live stand: the overall combined ranking (all poules flattened, same
  // points/saldo/games-voor tie-break as within a poule) for whichever
  // upcoming event is currently running its poulefase. Only meaningful once
  // poules have been drawn.
  let liveStand: Array<PouleStandingRow & { name: string; pouleLabel: string }> = [];
  if (upcoming) {
    const [teams, poules, matches] = await Promise.all([
      repo.listTeams(upcoming.id),
      repo.listPoules(upcoming.id),
      repo.listMatches(upcoming.id),
    ]);
    if (poules.length > 0) {
      const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
      const pouleByTeam = new Map<string, string>();
      for (const poule of poules) for (const teamId of poule.teamIds) pouleByTeam.set(teamId, poule.label);
      const pouleStandings = groupStandingsByPoule(poules, matches, upcoming.points);
      liveStand = sortStandings(pouleStandings.flatMap((p) => p.rows)).map((row) => ({
        ...row,
        name: teamNameById[row.teamId] ?? "?",
        pouleLabel: pouleByTeam.get(row.teamId) ?? "?",
      }));
    }
  }

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <Logo variant="light" size="lg" />
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-8">
        {upcoming ? (
          <section className="relative flex flex-col gap-5 overflow-hidden rounded-[32px] bg-glass-blue p-6 text-white">
            <div
              className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between gap-3">
              <span className="font-mint text-sm font-bold text-white/80">Volgende editie</span>
              <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 font-mint text-xs font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-lime" aria-hidden="true" />
                {countdownLabel(daysUntil(upcoming.date))}
              </span>
            </div>
            <div className="relative flex flex-col gap-1">
              <h1 className="font-mint text-5xl font-bold leading-[0.95] [text-wrap:balance]">{upcoming.name}</h1>
              <p className="font-mint text-lg font-semibold text-white/90">
                {fmtEventDateLong(upcoming.date)} · {upcoming.startTime}
              </p>
            </div>
            <div className="relative grid grid-cols-2 gap-4 rounded-2xl border border-white/25 p-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Locatie</div>
                <div className="text-sm font-semibold leading-snug">{upcoming.location}</div>
              </div>
              <div className="border-l border-white/25 pl-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Opzet</div>
                <div className="text-sm font-semibold leading-snug">Poules + knock-out</div>
              </div>
            </div>
            <Link
              href={`/${upcoming.slug}`}
              className="relative flex h-14 w-full items-center justify-center rounded-full bg-mint-lime font-mint text-lg font-bold text-mint-lime-ink hover:brightness-105"
            >
              Bekijk event
            </Link>
          </section>
        ) : (
          <p className="text-sm text-mint-ink-muted">Nog geen aankomend event gepland.</p>
        )}

        {liveStand.length > 0 ? <LiveStand rows={liveStand} /> : null}

        {pastWithTeamCounts.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="font-mint text-2xl font-bold text-mint-ink">Vorige events</h2>
            {pastWithTeamCounts.map(({ event: e, teamCount }) => (
              <Link
                key={e.id}
                href={`/${e.slug}`}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-95"
              >
                <DateChip date={e.date} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mint text-lg font-bold text-mint-ink">{e.name}</div>
                  <div className="truncate text-xs text-mint-ink-muted">
                    {teamCount} teams · {e.location}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}

/**
 * Live stand: the overall ranking across every poule combined. Typography and
 * the rank-badge treatment (solid lime circle for the top 3, pale otherwise)
 * mirror components/mint/poule-table.tsx's row styling exactly, so the same
 * "who's doing well" visual language carries over from Standen to the
 * homepage — the poule letter gets its own small muted badge alongside it
 * since this list spans all four poules at once.
 */
function LiveStand({ rows }: { rows: Array<PouleStandingRow & { name: string; pouleLabel: string }> }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-mint text-2xl font-bold text-mint-ink">Live stand</h2>
      <div className="flex flex-col gap-1 rounded-[28px] bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
        <div className="flex items-center justify-end gap-2 px-1 pb-1">
          <span className="w-10 flex-none text-right font-mint text-sm font-medium text-mint-ink-muted">Saldo</span>
          <span className="w-12 flex-none text-right font-mint text-sm font-medium text-mint-ink-muted">Punten</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.teamId} className="flex items-center gap-2 rounded-2xl px-2 py-2.5">
            <span
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-mint text-lg font-bold tabular-nums ${
                i < 3 ? "bg-mint-lime text-mint-lime-ink" : "bg-mint-lime/15 text-mint-ink-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-mint-net/20 font-mint text-[10px] font-bold text-mint-ink">
              {row.pouleLabel}
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-mint-ink">{row.name}</span>
            <span className="w-10 flex-none text-right text-sm tabular-nums text-mint-ink-muted">
              {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
            </span>
            <span className="w-12 flex-none text-right font-mint text-2xl font-bold tabular-nums text-mint-ink">{row.points}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DateChip({ date }: { date: string }) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "");
  return (
    <div className="flex flex-none flex-col items-center justify-center rounded-xl bg-mint-net/20 px-3 py-2">
      <span className="font-mint text-xl font-bold leading-none text-mint-ink">{day}</span>
      <span className="font-mint text-[10px] font-bold uppercase tracking-wider text-mint-ink-muted">{month}</span>
    </div>
  );
}
