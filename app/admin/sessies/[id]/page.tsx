import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { sessionCapacity, activeReservations, fmtClockTime } from "@/lib/sessions";
import { Field } from "@/components/ui/field";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, ActionFormError, SaveButton } from "@/components/admin/action-form";
import { Section } from "@/components/admin/section";
import { ShareLink } from "@/components/sessions/share-link";
import type { SessionStatus } from "@/lib/session-types";
import { cancelReservation, deleteSession, markReservationPaid, setSessionStatus, updateSessionDetails } from "../actions";

const STATUS_LABEL: Record<SessionStatus, string> = {
  draft: "Concept",
  open: "Open voor aanmelden",
  closed: "Gesloten",
  done: "Afgerond",
};

/** Forward-only status order, same manual-advance philosophy as the tournament
 * phases (see lib/phases.ts) — no auto-transitions, the admin always clicks. */
const STATUS_ORDER: SessionStatus[] = ["draft", "open", "closed", "done"];
const STATUS_CTA: Record<SessionStatus, string | null> = {
  draft: "Open voor aanmelden",
  open: "Sluit aanmelden",
  closed: "Markeer als afgerond",
  done: null,
};

const RESERVATION_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  held: { label: "Gereserveerd", className: "bg-glass-blue/15 text-glass-blue" },
  paid: { label: "Betaald", className: "bg-mint-lime/20 text-mint-lime-ink" },
  expired: { label: "Verlopen", className: "bg-mint-net/20 text-mint-ink-muted" },
  cancelled: { label: "Geannuleerd", className: "bg-clay-orange/15 text-clay-orange" },
};

export default async function AdminSessionDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const session = await sessionsRepo.getSession(params.id);
  if (!session) notFound();

  const [members, reservations] = await Promise.all([
    sessionsRepo.listMembers(),
    sessionsRepo.listReservations(session.id),
  ]);
  const memberNameById = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const capacity = sessionCapacity(session);
  const taken = activeReservations(reservations).length;
  const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(session.status) + 1] ?? null;
  const cta = STATUS_CTA[session.status];

  const host = headers().get("host");
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const shareUrl = host ? `${proto}://${host}/${session.slug}` : `/${session.slug}`;

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <div>
          <Link href="/admin/sessies" className="font-mint text-sm font-bold text-mint-ink-muted hover:text-mint-ink">
            ← Sessies
          </Link>
          <h1 className="mt-1 font-mint text-4xl font-bold text-mint-ink">{session.title}</h1>
          <p className="text-sm text-mint-ink-muted">
            {session.date} · {session.startTime} · {session.location} · {session.courts} banen
          </p>
        </div>

        <ShareLink url={shareUrl} title={session.title} />

        <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <div className="flex items-center justify-between">
            <span className="font-mint text-lg font-bold text-mint-ink">{STATUS_LABEL[session.status]}</span>
            <span className="font-mint text-sm font-bold tabular-nums text-mint-ink-muted">
              {taken} van {capacity} plekken
            </span>
          </div>
          {cta && nextStatus ? (
            <div className="mt-4">
              <ConfirmButton
                key={session.status}
                label={cta}
                confirmText={`${cta}? Dit is direct zichtbaar op de publieke aanmeldpagina.`}
                action={setSessionStatus.bind(null, session.id, nextStatus)}
                successMessage="Status bijgewerkt."
              />
            </div>
          ) : null}
        </div>

        <Section title="Reserveringen" subtitle={`${reservations.length} in totaal`}>
          {reservations.length === 0 ? (
            <p className="text-sm text-mint-ink-muted">Nog niemand aangemeld.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {reservations.map((r) => {
                const status = RESERVATION_STATUS_LABEL[r.status] ?? { label: r.status, className: "bg-mint-net/20 text-mint-ink-muted" };
                return (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-mint-net/10 px-3 py-2 text-sm">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-semibold text-mint-ink">{memberNameById[r.memberId] ?? "?"}</span>
                      <span className="text-xs text-mint-ink-muted">
                        {r.status === "held"
                          ? `Verloopt om ${fmtClockTime(r.holdExpiresAt)}`
                          : r.status === "paid" && r.paidAt
                            ? `Betaald om ${fmtClockTime(r.paidAt)}`
                            : `Gereserveerd om ${fmtClockTime(r.reservedAt)}`}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 font-mint text-xs font-bold ${status.className}`}>
                      {status.label}
                    </span>
                    {r.status === "held" ? (
                      <ConfirmButton
                        label="Markeer betaald"
                        confirmText={`"${memberNameById[r.memberId] ?? "?"}" markeren als betaald?`}
                        action={markReservationPaid.bind(null, session.id, r.id)}
                        variant="secondary"
                        size="sm"
                        successMessage="Gemarkeerd als betaald."
                      />
                    ) : null}
                    {r.status === "held" || r.status === "paid" ? (
                      <ConfirmButton
                        label="Annuleer"
                        icon="✕"
                        confirmText={`Reservering van "${memberNameById[r.memberId] ?? "?"}" annuleren?`}
                        action={cancelReservation.bind(null, session.id, r.id)}
                        variant="danger"
                        size="sm"
                        successMessage="Reservering geannuleerd."
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <details className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <summary className="cursor-pointer px-4 py-4 font-mint text-lg font-bold text-mint-ink">Instellingen</summary>
          <div className="flex flex-col gap-6 border-t border-mint-net/15 px-4 pb-4 pt-4">
            <div className="flex flex-col gap-3">
              <h3 className="font-mint text-sm font-bold text-mint-ink-muted">Sessie bewerken</h3>
              <ActionForm action={updateSessionDetails.bind(null, session.id)} className="flex flex-col gap-3">
                <Field label="Titel" name="title" defaultValue={session.title} required />
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-mint-ink-muted">Slug (voor de URL)</span>
                  <input
                    name="slug"
                    defaultValue={session.slug}
                    required
                    className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
                  />
                  <span className="text-xs text-mint-ink-muted">
                    Publieke link wordt event.padelsocial.nl/{session.slug}.
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Datum" name="date" type="date" defaultValue={session.date} required />
                  <Field label="Starttijd" name="startTime" type="time" defaultValue={session.startTime} required />
                </div>
                <Field label="Locatie" name="location" defaultValue={session.location} required />
                <Field label="Aantal banen" name="courts" type="number" defaultValue={session.courts} required />
                <Field label="Tikkie-link" name="tikkieUrl" defaultValue={session.tikkieUrl ?? ""} placeholder="https://tikkie.me/pay/…" />
                <ActionFormError />
                <SaveButton />
              </ActionForm>
            </div>

            <div className="flex flex-col gap-3 border-t border-mint-net/15 pt-6">
              <h3 className="font-mint text-sm font-bold text-clay-orange">Gevarenzone</h3>
              <ConfirmButton
                label="Sessie verwijderen"
                confirmText={`"${session.title}" permanent verwijderen? Alle reserveringen gaan verloren.`}
                action={deleteSession.bind(null, session.id)}
                variant="danger"
              />
            </div>
          </div>
        </details>
      </main>
    </div>
  );
}
