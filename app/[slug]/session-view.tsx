import { headers } from "next/headers";
import { sessionsRepo } from "@/lib/data/sessions";
import { activeReservations, sessionCapacity } from "@/lib/sessions";
import type { Session } from "@/lib/session-types";
import { Logo } from "@/components/logo";
import { SignupForm } from "@/components/sessions/signup-form";
import { CourtSpots } from "@/components/sessions/court-spots";
import { AlreadySignedUp } from "@/components/sessions/already-signed-up";
import { GoodToKnow } from "@/components/sessions/good-to-know";
import { reserveSpotAction } from "./session-actions";

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
  const memberNameById = Object.fromEntries(members.map((m) => [m.id, m.name]));
  // "Al aangemeld" only lists confirmed (paid) spots — a held-but-unpaid
  // reservation can still expire, so showing it here would overpromise.
  const signedUpNames = active.filter((r) => r.status === "paid").map((r) => memberNameById[r.memberId] ?? "?");

  const host = headers().get("host");
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const shareUrl = host ? `${proto}://${host}/${session.slug}` : `/${session.slug}`;

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-4">
          <Logo variant="light" />
          <h1 className="min-w-0 truncate font-mint text-2xl font-bold text-mint-ink">Sessie</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
        <div>
          <h2 className="font-mint text-3xl font-bold text-[#0E2318]">{session.title}</h2>
          <p className="text-sm text-mint-ink-muted">
            {session.date} · {session.startTime} · {session.location} · {session.courts} banen
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <div className="flex items-center justify-between">
            <span className="font-mint text-lg font-bold text-[#0E2318]">Plekken</span>
            <span className="font-mint text-sm font-bold tabular-nums text-mint-ink-muted">
              {taken} van {capacity} bezet
            </span>
          </div>
          <div className="mt-3">
            <CourtSpots courts={session.courts} takenCount={taken} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          {session.status === "open" ? (
            <SignupForm sessionId={session.id} members={members} tikkieUrl={session.tikkieUrl} reserveSpot={reserveSpotAction} />
          ) : (
            <p className="text-sm text-mint-ink-muted">{STATUS_MESSAGE[session.status]}</p>
          )}
        </div>

        <AlreadySignedUp names={signedUpNames} shareUrl={shareUrl} shareTitle={session.title} />

        <GoodToKnow />
      </main>
    </div>
  );
}
