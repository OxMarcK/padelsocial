import { headers } from "next/headers";
import { sessionsRepo } from "@/lib/data/sessions";
import { activeReservations, sessionCapacity } from "@/lib/sessions";
import { fmtWeekday } from "@/lib/share-metadata";
import type { Session } from "@/lib/session-types";
import { Logo } from "@/components/logo";
import { DayBadge } from "@/components/day-badge";
import { SignupFlow } from "@/components/sessions/signup-flow";
import { CourtSpots } from "@/components/sessions/court-spots";
import { AlreadySignedUp } from "@/components/sessions/already-signed-up";
import { CourtVideos } from "@/components/sessions/court-videos";
import { GoodToKnow } from "@/components/sessions/good-to-know";
import { createMemberAndReserveAction, reserveSpotAction } from "./session-actions";

const STATUS_MESSAGE: Record<"draft" | "closed" | "done", string> = {
  draft: "Aanmelden is nog niet open voor deze sessie.",
  closed: "Aanmelden is gesloten voor deze sessie.",
  done: "Deze sessie is al geweest.",
};

/** The session half of the /{slug} dispatcher (see app/[slug]/page.tsx) — takes
 * the already-looked-up session rather than re-fetching by slug. Mobile-first:
 * this is meant to be opened from a WhatsApp link on a phone — but with zero
 * shared components with the tournament side, per the plan's "fully separate"
 * requirement. */
export async function SessionSignupView({ session }: { session: Session }) {
  const [members, reservations] = await Promise.all([
    sessionsRepo.listMembers(),
    sessionsRepo.listReservations(session.id),
  ]);

  const capacity = sessionCapacity(session);
  const active = activeReservations(reservations);
  const taken = active.length;
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  // "Deelnemers" only lists confirmed (paid) spots — a held-but-unpaid
  // reservation can still expire, so showing it here would overpromise.
  const signedUpEntries = active
    .filter((r) => r.status === "paid")
    .map((r) => ({ name: memberById[r.memberId]?.name ?? "?", level: memberById[r.memberId]?.level ?? null }));

  const host = headers().get("host");
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const shareUrl = host ? `${proto}://${host}/${session.slug}` : `/${session.slug}`;

  return (
    <div
      className="min-h-screen font-mint text-[#0E2318]"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(14,35,24,.10)]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-6 py-3.5">
          <Logo variant="light" size="md" />
          <h1 className="min-w-0 truncate font-mint text-2xl font-bold text-[#0E2318]">Sessie</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-8">
        <div>
          <h2 className="text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[0.98] tracking-tight text-[#0E2318]">{session.title}</h2>
        </div>

        <div className="flex items-center gap-4 rounded-[20px] bg-white p-4 shadow-[0_10px_24px_rgba(14,35,24,.07)]">
          <DayBadge date={session.date} tone="light" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold leading-snug text-[#4F6E14]">
              {fmtWeekday(session.date)} {session.startTime}
            </span>
            <span className="text-sm font-medium leading-snug text-[#5C7266]">
              {session.location} · {session.courtNumbers.length} banen
            </span>
          </span>
        </div>

        <div className="rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(14,35,24,.06)]">
          <div className="flex items-center justify-between">
            <span className="font-mint text-lg font-bold text-[#0E2318]">Plekken</span>
            <span className="font-mint text-sm font-bold tabular-nums text-mint-ink-muted">
              {taken} van {capacity} bezet
            </span>
          </div>
          <div className="mt-3">
            <CourtSpots courts={session.courtNumbers.length} takenCount={taken} />
          </div>
        </div>

        {session.status !== "done" ? (
          <div className="rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(14,35,24,.06)]">
            {session.status === "open" ? (
              <SignupFlow
                sessionId={session.id}
                members={members}
                tikkieUrl={session.tikkieUrl}
                reserveSpot={reserveSpotAction}
                createMemberAndReserve={createMemberAndReserveAction}
              />
            ) : (
              <p className="text-sm text-mint-ink-muted">{STATUS_MESSAGE[session.status]}</p>
            )}
          </div>
        ) : null}

        {session.status === "done" ? (
          <CourtVideos courtNumbers={session.courtNumbers} courtVideos={session.courtVideos} />
        ) : null}

        <AlreadySignedUp
          entries={signedUpEntries}
          shareUrl={shareUrl}
          shareTitle={session.title}
          showInvite={session.status !== "done"}
        />

        <GoodToKnow highestCourtNumber={Math.max(...session.courtNumbers)} />
      </main>
    </div>
  );
}
