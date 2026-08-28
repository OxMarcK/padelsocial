import type { Metadata } from "next";
import Link from "next/link";
import { repo } from "@/lib/data";
import type { PadelEvent } from "@/lib/types";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const OG_DESCRIPTION = "Volg live de standen, je baanindeling en de knock-out.";

/** Whole calendar days from today to `date` — can be negative if the event already started. */
function daysUntil(date: string): number {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * "draft" doubles as two very different things: an event an admin is still
 * configuring (weeks out, no date/teams finalized yet — shouldn't be public)
 * and "Inchecken", the phase actually happening live on the event's own
 * morning before poulefase starts. Hiding drafts outright made an event
 * disappear from the landing page at exactly the moment people are arriving
 * and looking for it. Once its date has arrived, treat it as public either way.
 */
function isPubliclyVisible(e: PadelEvent): boolean {
  return e.status !== "finished" && (e.status !== "draft" || daysUntil(e.date) <= 0);
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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-5 py-10">
      <Logo size="lg" />

      {upcoming ? (
        <section className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-glass-blue p-6">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-flood-white/10"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-3">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-flood-white/80">Volgende editie</span>
            <span className="flex items-center gap-1.5 rounded-full bg-court-night/30 px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-flood-white">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-serve" aria-hidden="true" />
              {countdownLabel(daysUntil(upcoming.date))}
            </span>
          </div>
          <div className="relative flex flex-col gap-1">
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] [text-wrap:balance]">{upcoming.name}</h1>
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-flood-white/90">
              {fmtEventDateLong(upcoming.date)} · {upcoming.startTime}
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-4 rounded-2xl border border-flood-white/25 p-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-flood-white/70">Locatie</div>
              <div className="text-sm font-semibold leading-snug">{upcoming.location}</div>
            </div>
            <div className="border-l border-flood-white/25 pl-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-flood-white/70">Opzet</div>
              <div className="text-sm font-semibold leading-snug">Poules + knock-out</div>
            </div>
          </div>
          <Link href={`/${upcoming.slug}`} className="relative">
            <Button fullWidth>Bekijk event</Button>
          </Link>
        </section>
      ) : (
        <p className="text-sm text-ink-muted">Nog geen aankomend event gepland.</p>
      )}

      {pastWithTeamCounts.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Vorige events</h2>
          {pastWithTeamCounts.map(({ event: e, teamCount }) => (
            <Link
              key={e.id}
              href={`/${e.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-flood-white/10 bg-surface px-4 py-3 hover:bg-flood-white/5"
            >
              <DateChip date={e.date} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg font-bold uppercase tracking-wide">{e.name}</div>
                <div className="truncate text-xs text-ink-muted">
                  {teamCount} teams · {e.location}
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}

function DateChip({ date }: { date: string }) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "");
  return (
    <div className="flex flex-none flex-col items-center justify-center rounded-xl bg-court-night px-3 py-2">
      <span className="font-display text-xl font-bold leading-none">{day}</span>
      <span className="font-display text-[10px] font-bold uppercase tracking-wider text-ink-muted">{month}</span>
    </div>
  );
}
