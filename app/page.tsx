import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import type { PadelEvent } from "@/lib/types";
import type { Session } from "@/lib/session-types";
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

function isPastDate(date: string): boolean {
  const d = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

/**
 * A session is worth surfacing here once it's open for signup or already closed
 * (still relevant — people who signed up still want to find it) and hasn't
 * happened yet. Unlike a tournament, a "draft" session stays hidden: a concept
 * tournament is still shown per isPubliclyVisible's reasoning above, but a draft
 * session isn't something anyone can act on yet, and there's always another one
 * coming next week — no urgency to reveal it early.
 */
function isUpcomingPublicSession(s: Session): boolean {
  return (s.status === "open" || s.status === "closed") && !isPastDate(s.date);
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
  const [events, sessions] = await Promise.all([repo.listEvents(), sessionsRepo.listSessions()]);
  const upcoming = events.find(isPubliclyVisible);
  const past = events.filter((e) => e.status === "finished");
  const upcomingSession = sessions.filter(isUpcomingPublicSession).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  // Whichever of the two is chronologically sooner goes on top — sessions recur
  // weekly and tournaments are the rare big thing, but "what's happening next"
  // should still read top-to-bottom in date order.
  const sessionFirst = upcoming && upcomingSession ? upcomingSession.date < upcoming.date : Boolean(upcomingSession);

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
  ) : upcomingSession ? null : (
    // Only show this fallback when there's neither an event nor a session to
    // point at — with a session row already on the page, "no event" alone
    // would read as a false negative.
    <p className="text-sm text-mint-ink-muted">Nog geen aankomend event gepland.</p>
  );

  const sessionRow = upcomingSession ? (
    <Link
      href={`/${upcomingSession.slug}`}
      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-95"
    >
      <DateChip date={upcomingSession.date} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-mint text-lg font-bold text-mint-ink">{upcomingSession.title}</div>
        <div className="truncate text-xs text-mint-ink-muted">
          {upcomingSession.startTime} · {upcomingSession.location}
        </div>
      </div>
      <span className="flex-none font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">
        {upcomingSession.status === "open" ? "Aanmelden open" : "Gesloten"}
      </span>
    </Link>
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
            {sessionRow}
            {tournamentHero}
          </>
        ) : (
          <>
            {tournamentHero}
            {sessionRow}
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
