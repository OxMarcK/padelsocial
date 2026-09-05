import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { Logo } from "@/components/logo";
import { buildShareMetadata, fmtDateShort } from "@/lib/share-metadata";
import { isUpcomingPublicEvent, isUpcomingPublicSession } from "@/lib/upcoming";

const OG_DESCRIPTION = "Volg live de standen, je baanindeling en de knock-out.";

/** Whole calendar days from today to `date` — can be negative if the event already started. */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function fmtEventDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export async function generateMetadata(): Promise<Metadata> {
  const events = await repo.listEvents();
  const upcoming = events.find(isUpcomingPublicEvent);
  const title = upcoming ? `${upcoming.name} - ${fmtDateShort(upcoming.date, upcoming.startTime)}` : "Padel Social";
  return buildShareMetadata(title, OG_DESCRIPTION);
}

function countdownLabel(days: number): string {
  if (days <= 0) return "Vandaag";
  if (days === 1) return "Morgen";
  return `Over ${days} dagen`;
}

export default async function LandingPage() {
  const [events, sessions] = await Promise.all([repo.listEvents(), sessionsRepo.listSessions()]);
  const upcoming = events.find(isUpcomingPublicEvent);
  const past = events.filter((e) => e.status === "finished");
  // Every not-yet-passed session shows, not just the soonest one — unlike a
  // tournament (a rare one-off, hence the single big hero), sessions recur
  // weekly, so there can legitimately be several open/full ones at once (e.g.
  // next week's already open for signup while this week's is still closed/full).
  const upcomingSessions = sessions.filter(isUpcomingPublicSession).sort((a, b) => a.date.localeCompare(b.date));
  const nextSession = upcomingSessions[0] ?? null;
  // Whichever of the two is chronologically sooner goes on top — "what's
  // happening next" should read top-to-bottom in date order.
  const sessionFirst = upcoming && nextSession ? nextSession.date < upcoming.date : Boolean(nextSession);

  const pastWithTeamCounts = await Promise.all(
    past.map(async (e) => ({ event: e, teamCount: (await repo.listTeams(e.id)).length }))
  );

  const tournamentHero = upcoming ? (
    <section className="relative flex flex-col gap-5 overflow-hidden rounded-[32px] bg-glass-blue p-6 text-white">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
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
  ) : nextSession ? null : (
    // Only show this fallback when there's neither an event nor a session to
    // point at — with a session row already on the page, "no event" alone
    // would read as a false negative.
    <p className="text-sm text-mint-ink-muted">Nog geen aankomend event gepland.</p>
  );

  const sessionRows =
    upcomingSessions.length > 0 ? (
      <div className="flex flex-col gap-2">
        {upcomingSessions.map((s) => (
          <Link
            key={s.id}
            href={`/${s.slug}`}
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-95"
          >
            <DateChip date={s.date} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-mint text-lg font-bold text-mint-ink">{s.title}</div>
              <div className="truncate text-xs text-mint-ink-muted">
                {s.startTime} · {s.location}
              </div>
            </div>
            <span className="flex-none font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">
              {s.status === "open" ? "Open" : "Vol"}
            </span>
          </Link>
        ))}
      </div>
    ) : null;

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
        {sessionFirst ? (
          <>
            {sessionRows}
            {tournamentHero}
          </>
        ) : (
          <>
            {tournamentHero}
            {sessionRows}
          </>
        )}

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
