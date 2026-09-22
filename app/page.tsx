import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";
import { siteSettingsRepo } from "@/lib/data/site-settings";
import { Logo } from "@/components/logo";
import { buildShareMetadata, fmtDateShort } from "@/lib/share-metadata";
import { isUpcomingPublicEvent, isUpcomingPublicSession, isPastPublicSession } from "@/lib/upcoming";
import { activeReservations } from "@/lib/sessions";
import { WHATSAPP_URL, INSTAGRAM_URL } from "@/lib/site-links";

const OG_DESCRIPTION = "Volg live de standen, je baanindeling en de knock-out.";

// Same reasoning as app/opengraph-image.tsx: no dynamic API is used here, so
// without this Next would try to prerender the homepage during `next build`
// — a live Supabase call that, on a bad day, can fail the whole deploy.
// Forcing dynamic rendering moves that call to request time instead.
export const dynamic = "force-dynamic";

function fmtEventDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export async function generateMetadata(): Promise<Metadata> {
  const events = await repo.listEvents();
  const upcoming = events.find(isUpcomingPublicEvent);
  const title = upcoming ? `${upcoming.name} - ${fmtDateShort(upcoming.date, upcoming.startTime)}` : "Padel Social — Agenda";
  return buildShareMetadata(title, OG_DESCRIPTION);
}

type HistoryRow = {
  date: string;
  href: string;
  title: string;
  meta: string;
  kind: "event" | "session";
};

export default async function LandingPage() {
  const [events, sessions, heroSettings] = await Promise.all([
    repo.listEvents(),
    sessionsRepo.listSessions(),
    siteSettingsRepo.getSiteSettings(),
  ]);
  const upcoming = events.find(isUpcomingPublicEvent) ?? null;
  const past = events.filter((e) => e.status === "finished");
  const upcomingSessions = sessions.filter(isUpcomingPublicSession).sort((a, b) => a.date.localeCompare(b.date));
  const nextSession = upcomingSessions[0] ?? null;
  const pastSessions = sessions.filter(isPastPublicSession);

  // One combined "history" list — events and sessions interleaved by date,
  // most recent first.
  const history: HistoryRow[] = await Promise.all([
    ...past.map(async (e) => {
      const teamCount = (await repo.listTeams(e.id)).length;
      return { date: e.date, href: `/${e.slug}`, title: e.name, meta: `${teamCount} teams · ${e.location}`, kind: "event" as const };
    }),
    ...pastSessions.map(async (s) => {
      const reservations = await sessionsRepo.listReservations(s.id);
      const attendeeCount = activeReservations(reservations).length;
      const teamCount = Math.floor(attendeeCount / 2);
      return { date: s.date, href: `/${s.slug}`, title: s.title, meta: `${teamCount} teams · ${s.location}`, kind: "session" as const };
    }),
  ]).then((rows) => rows.sort((a, b) => b.date.localeCompare(a.date)));

  // Whichever of a tournament or a session is chronologically sooner is the
  // one featured in the "Volgende event" card.
  const heroPick: { kind: "event" | "session"; date: string; slug: string; name: string; startTime: string; location: string } | null =
    upcoming && (!nextSession || upcoming.date <= nextSession.date)
      ? { kind: "event", date: upcoming.date, slug: upcoming.slug, name: upcoming.name, startTime: upcoming.startTime, location: upcoming.location }
      : nextSession
        ? { kind: "session", date: nextSession.date, slug: nextSession.slug, name: nextSession.title, startTime: nextSession.startTime, location: nextSession.location }
        : null;

  // The hero flyer is set by the organizer independent of which event/session
  // happens to be soonest (see app/admin/agenda) — falls back to linking the
  // soonest event/session, then the WhatsApp group, if no explicit link was
  // set. Always resolves to something so the flyer itself never depends on
  // whether a link was filled in.
  const heroFlyerHref = heroSettings.heroFlyerLink || (heroPick ? `/${heroPick.slug}` : null) || WHATSAPP_URL;

  return (
    <div className="min-h-screen bg-[#F4F8F4] font-mint text-[#0E2318]">
      <header className="sticky top-0 z-30 bg-white/95 shadow-[0_1px_0_rgba(14,35,24,.10)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3.5">
          <Logo variant="light" size="md" />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-2 rounded-full bg-[#0E2318] px-4 py-2 text-sm font-bold text-white hover:bg-[#193626]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-none" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0-7.75 13.55L3 21l4.6-1.2A9 9 0 1 0 12 3Z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinejoin="round" />
              <path
                d="M8.3 8.9c.3-.7.6-.7.9-.7h.5c.2 0 .4 0 .6.4l.7 1.6c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.3 0 .5.3.6.8 1.2 1.4 1.7.6.5 1.2.9 1.9 1.1.2.1.3 0 .5-.1l.6-.6c.2-.2.4-.2.6-.1l1.5.8c.3.1.3.3.3.5 0 .3-.1.7-.3 1-.3.4-.8.7-1.3.7-1 0-2.6-.4-4.3-1.9-2-1.7-3.2-3.7-3.4-4.1-.2-.4-.6-1.2-.6-2 0-.6.2-1 .4-1.2Z"
                fill="#FFFFFF"
              />
            </svg>
            WhatsApp
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-5 pt-8 sm:pt-11">
          <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-5">
              <h1 className="text-[2.4rem] font-extrabold leading-[0.98] tracking-tight sm:text-6xl">Agenda</h1>
              <p className="max-w-[42ch] text-base font-medium leading-relaxed text-[#43584C] sm:text-lg">
                Kijk welke zondagen er open staan, kies je datum en speel mee. Kom je alleen? Dan zorgen wij voor een partner.
              </p>

              <div className="flex flex-col gap-3 rounded-[22px] bg-white p-5 shadow-[0_10px_26px_rgba(14,35,24,.07)]">
                <div className="flex items-center gap-3">
                  <span className="h-[9px] w-[9px] flex-none animate-pulse2 rounded-full bg-[#4F6E14]" />
                  <span className="text-sm font-bold">Elke zondag</span>
                  <span className="ml-auto text-xs font-bold text-[#5C7266]">2 uur spelen</span>
                </div>
                <div className="h-px bg-[#0E2318]/[.08]" />
                <div className="flex items-center gap-3">
                  <span className="h-[9px] w-[9px] flex-none rounded-[2px] bg-[#1E64F0]" />
                  <span className="text-sm font-bold">Ballen liggen klaar</span>
                  <span className="ml-auto text-xs font-bold text-[#5C7266]">Racket &amp; schoenen meenemen</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <a
                  href="#agenda"
                  className="flex h-[54px] flex-1 basis-[180px] items-center justify-center gap-2 rounded-[18px] bg-[#0E2318] px-6 text-base font-bold text-white hover:bg-[#193626]"
                >
                  Naar de agenda
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[54px] flex-1 basis-[180px] items-center justify-center rounded-[18px] border-2 border-[#0E2318]/[.14] px-6 text-base font-bold hover:border-[#4F6E14]"
                >
                  WhatsApp Community
                </a>
              </div>
            </div>

            {heroSettings.heroFlyerUrl ? (
              <a
                href={heroFlyerHref}
                className="relative mx-auto block aspect-[719/898] w-full max-w-[430px] overflow-hidden rounded-[26px] bg-[#E7EEE9] shadow-[0_14px_34px_rgba(14,35,24,.12)] hover:shadow-[0_20px_44px_rgba(14,35,24,.2)]"
              >
                <Image src={heroSettings.heroFlyerUrl} alt="Flyer" fill className="object-contain" />
                <span className="absolute inset-x-3.5 bottom-3.5 flex items-center gap-2.5 rounded-[14px] bg-[#D2E95C] px-3.5 py-2.5 text-sm font-extrabold text-[#0E2318] shadow-[0_8px_20px_rgba(14,35,24,.18)]">
                  Inschrijven voor dit toernooi
                </span>
              </a>
            ) : (
              <div className="mx-auto flex aspect-[719/898] w-full max-w-[430px] flex-col items-center justify-center gap-2 rounded-[26px] bg-[#E7EEE9] text-center text-[#5C7266]">
                <span className="text-sm font-bold">Flyer volgt</span>
                <span className="max-w-[22ch] text-xs font-medium">Zodra het volgende toernooi vaststaat, zie je de flyer hier.</span>
              </div>
            )}
          </div>
        </section>

        {/* Agenda */}
        <section id="agenda" className="mx-auto flex max-w-5xl flex-col gap-3.5 px-5 pt-9 sm:pt-14">
          {heroPick ? (
            <div className="flex flex-col gap-2 rounded-[26px] bg-[#0E2318] p-6 text-white sm:grid sm:grid-cols-2 sm:items-center sm:gap-8">
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D2E95C]">
                  Volgende event · {fmtEventDateLong(heroPick.date)}
                </span>
                <h2 className="text-[1.7rem] font-extrabold leading-[1.05] tracking-tight sm:text-3xl">{heroPick.name}</h2>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{heroPick.startTime}</span>
                  <span className="text-sm font-medium text-white/80">{heroPick.location}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/${heroPick.slug}`}
                  className="flex h-[54px] items-center justify-center gap-2.5 rounded-[18px] bg-[#D2E95C] text-base font-bold text-[#0E2318] hover:brightness-105"
                >
                  {heroPick.kind === "event" ? "Bekijk event" : "Inschrijven"}
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[54px] items-center justify-center rounded-[18px] border-2 border-white/[.18] bg-white/10 text-sm font-bold hover:border-[#D2E95C]"
                >
                  Vragen? Stel ze in de groep
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-[22px] bg-white p-6 shadow-[0_10px_24px_rgba(14,35,24,.06)]">
              <span className="text-lg font-bold">Elke zondag — datum volgt</span>
              <span className="text-sm font-medium text-[#5C7266]">
                We plannen de eerstvolgende zondag zodra de baan vaststaat — hou de WhatsApp in de gaten.
              </span>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex h-[50px] w-full items-center justify-center rounded-[16px] bg-[#0E2318] text-sm font-bold text-white hover:bg-[#193626] sm:w-fit sm:px-6"
              >
                Join onze WhatsApp Community
              </a>
            </div>
          )}

          {upcomingSessions.length > 1
            ? upcomingSessions.slice(1).map((s) => (
                <Link
                  key={s.id}
                  href={`/${s.slug}`}
                  className="flex items-center gap-4 rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(14,35,24,.07)] hover:shadow-[0_14px_30px_rgba(14,35,24,.13)]"
                >
                  <DayBadge date={s.date} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-lg font-extrabold leading-tight">{s.title}</span>
                    <span className="text-sm font-semibold text-[#4F6E14]">{s.startTime}</span>
                    <span className="text-sm font-medium text-[#5C7266]">{s.location}</span>
                  </span>
                  <span className="flex-none rounded-full bg-[#F1F5EF] px-3.5 py-1.5 text-sm font-bold">
                    {s.status === "open" ? "Inschrijven" : "Vol"}
                  </span>
                </Link>
              ))
            : null}
        </section>

        {/* Vorige edities */}
        {history.length > 0 ? (
          <section id="vorige" className="mx-auto flex max-w-5xl flex-col gap-3.5 px-5 pt-9 sm:pt-16">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[2.1rem]">Vorige edities</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {history.map((h) => (
                <Link
                  key={h.href}
                  href={h.href}
                  className={
                    h.kind === "event"
                      ? "flex flex-col gap-2.5 rounded-[20px] bg-[#0E2318] p-4 text-white shadow-[0_10px_24px_rgba(14,35,24,.16)] hover:bg-[#193626]"
                      : "flex flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(14,35,24,.06)] hover:shadow-[0_12px_26px_rgba(14,35,24,.12)]"
                  }
                >
                  <span className={`text-[11px] font-extrabold uppercase tracking-widest ${h.kind === "event" ? "text-white/65" : "text-[#5C7266]"}`}>
                    {fmtDateShort(h.date, "").replace(/,\s*$/, "")}
                  </span>
                  <span className="text-lg font-extrabold leading-tight">{h.title}</span>
                  <span className={`text-sm font-medium ${h.kind === "event" ? "text-white/72" : "text-[#5C7266]"}`}>{h.meta}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Nieuw hier? */}
        <section className="mx-auto max-w-5xl px-5 pt-9 sm:pt-16">
          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#5C7266]">Nieuw hier?</span>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[2.1rem]">
                Recreatief padel in Rotterdam, elke zondag
              </h2>
              <p className="max-w-[46ch] text-base font-medium leading-relaxed text-[#43584C]">
                Je schrijft je per event in, geen lidmaatschap, geen vast team. Het Up &amp; Down systeem zorgt dat je
                binnen een uur op je eigen niveau speelt en na afloop wordt er nagepraat.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {["nieuw-hier-1", "nieuw-hier-2", "nieuw-hier-3", "nieuw-hier-4"].map((name) => (
                <div key={name} className="relative aspect-square overflow-hidden rounded-[20px] bg-[#DDE8E0]">
                  <Image
                    src={`/photos/${name}.jpg`}
                    alt="Padel Social spelers op de baan"
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formats */}
        <section className="mx-auto flex max-w-5xl flex-col gap-3.5 px-5 pt-9 sm:pt-16">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-[1.7rem]">Formats</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <FormatCard
              title="Up & Down"
              copy="Individueel inschrijven, wisselende partner per ronde. Winnen = baan omhoog."
              icon={
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-[#D2E95C]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0E2318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
                    <path d="m3 16 4 4 4-4" />
                    <path d="M7 20V4" />
                    <path d="m21 8-4-4-4 4" />
                    <path d="M17 4v16" />
                  </svg>
                </span>
              }
            />
            <FormatCard
              title="King of the Court"
              copy="Met je vaste partner de hele ochtend door, tegen wisselende koppels."
              icon={
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-[#D2E95C]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0E2318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
                    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                    <path d="M5 21h14" />
                  </svg>
                </span>
              }
            />
            <FormatCard
              title="Toernooi"
              copy="Eén keer per maand: poules, knock-out en napraten met een hapje."
              icon={
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-[#D2E95C]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0E2318" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
                    <path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />
                    <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />
                    <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />
                    <path d="M4 22h16" />
                    <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                    <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />
                  </svg>
                </span>
              }
            />
          </div>
        </section>

        {/* Community */}
        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-2.5 px-5 pt-9 sm:grid-cols-2 sm:pt-16">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(14,35,24,.06)] hover:shadow-[0_12px_26px_rgba(14,35,24,.12)]"
          >
            <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-[#F1F5EF]">
              <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]" aria-hidden="true">
                <path d="M12 3a9 9 0 0 0-7.75 13.55L3 21l4.6-1.2A9 9 0 1 0 12 3Z" stroke="#0E2318" strokeWidth="1.8" strokeLinejoin="round" />
                <path
                  d="M8.3 8.9c.3-.7.6-.7.9-.7h.5c.2 0 .4 0 .6.4l.7 1.6c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.3 0 .5.3.6.8 1.2 1.4 1.7.6.5 1.2.9 1.9 1.1.2.1.3 0 .5-.1l.6-.6c.2-.2.4-.2.6-.1l1.5.8c.3.1.3.3.3.5 0 .3-.1.7-.3 1-.3.4-.8.7-1.3.7-1 0-2.6-.4-4.3-1.9-2-1.7-3.2-3.7-3.4-4.1-.2-.4-.6-1.2-.6-2 0-.6.2-1 .4-1.2Z"
                  fill="#0E2318"
                />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-bold">WhatsApp Community</span>
              <span className="text-xs font-medium text-[#5C7266]">Nieuwe data, banen en last-minute plekken</span>
            </span>
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(14,35,24,.06)] hover:shadow-[0_12px_26px_rgba(14,35,24,.12)]"
          >
            <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-[#0E2318]">
              <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="#FFFFFF" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth="1.8" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="#FFFFFF" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-bold">@padelsocial.nl</span>
              <span className="text-xs font-medium text-[#5C7266]">Beelden en uitslagen van elke editie</span>
            </span>
          </a>
        </section>

        <footer className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pb-10 pt-9 sm:pt-16">
          <div className="h-px bg-[#0E2318]/[.10]" />
          <div className="flex flex-wrap items-center gap-3.5">
            <Logo variant="light" size="sm" />
            <span className="ml-auto text-xs font-medium text-[#7A8C82]">© 2026 Padel Social</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function DayBadge({ date }: { date: string }) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString("nl-NL", { month: "short" }).replace(".", "").toUpperCase();
  return (
    <div className="flex h-[62px] w-[60px] flex-none flex-col items-center justify-center rounded-2xl bg-[#D2E95C] leading-none">
      <span className="text-2xl font-extrabold tracking-tight text-[#0E2318]">{day}</span>
      <span className="text-[10px] font-extrabold tracking-widest text-[#3F5610]">{month}</span>
    </div>
  );
}

function FormatCard({ title, copy, icon }: { title: string; copy: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5 rounded-[20px] bg-white p-[18px] shadow-[0_8px_20px_rgba(14,35,24,.06)]">
      {icon}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[17px] font-extrabold tracking-tight">{title}</span>
        <span className="text-sm font-medium leading-relaxed text-[#5C7266]">{copy}</span>
      </span>
    </div>
  );
}
