import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { AdminShell } from "@/components/admin/admin-shell";
import { DetailsCard } from "@/components/admin/details-card";
import { DayBadge } from "@/components/day-badge";
import { fmtWeekday } from "@/lib/share-metadata";
import type { Session } from "@/lib/session-types";
import { createSession } from "./actions";

/** Only draft/open get a badge next to the title — a session is either
 * "normal" (closed, just full) or something the admin needs to notice
 * (still a concept, or currently taking sign-ups). */
const TITLE_BADGE: Partial<Record<Session["status"], { label: string; className: string }>> = {
  draft: { label: "Concept", className: "bg-mint-net/15 text-mint-ink-muted" },
  open: { label: "Open", className: "bg-mint-lime/20 text-mint-lime-ink" },
};

function SessionRow({ session }: { session: Session }) {
  const badge = TITLE_BADGE[session.status];
  return (
    <Link
      href={`/admin/sessies/${session.id}`}
      className="flex items-center gap-4 rounded-[20px] bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-[.98]"
    >
      <DayBadge date={session.date} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate font-mint text-lg font-bold text-[#0E2318]">{session.title}</span>
          {badge ? (
            <span className={`flex-none rounded-full px-2.5 py-1 font-mint text-xs font-bold ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-semibold leading-snug text-mint-lime-ink">
          {fmtWeekday(session.date)} {session.startTime}
        </span>
        <span className="text-sm leading-snug text-mint-ink-muted">{session.location}</span>
      </span>
    </Link>
  );
}

/** Own admin route, deliberately not nested under app/admin/e/** — see the plan's
 * "fully separate from the tournament side" requirement. */
export default async function AdminSessionsPage() {
  const email = await requireAdmin();
  const sessions = await sessionsRepo.listSessions();
  const upcoming = sessions.filter((s) => s.status !== "done");
  const history = sessions.filter((s) => s.status === "done");

  return (
    <AdminShell email={email}>
      <h1 className="font-mint text-4xl font-extrabold tracking-tight text-[#0E2318]">Sessies</h1>

      <div className="flex flex-col gap-2">
        <DetailsCard
          summary={
            <>
              <DayBadge plus />
              <span className="font-mint text-lg font-bold text-[#0E2318]">Nieuwe sessie</span>
            </>
          }
        >
          <form action={createSession} className="flex flex-col gap-3 px-4 pb-4 pt-1">
            <Field label="Titel" name="title" required placeholder="Dinsdagavond padel" />
            <Field label="Slug (voor de URL)" name="slug" required placeholder="dinsdagavond-3-sept" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum" name="date" type="date" required />
              <Field label="Starttijd" name="startTime" type="time" defaultValue="19:00" required />
            </div>
            <Field label="Locatie" name="location" required placeholder="Padelclub Rotterdam" />
            <Field
              label="Baannummers (komma-gescheiden)"
              name="courtNumbers"
              defaultValue="1, 2, 3, 4"
              placeholder="1, 2, 3, 4"
              required
            />
            <Field label="Tikkie-link" name="tikkieUrl" placeholder="https://tikkie.me/pay/…" />
            <Button type="submit" fullWidth>
              Sessie aanmaken
            </Button>
          </form>
        </DetailsCard>

        {upcoming.map((s) => (
          <SessionRow key={s.id} session={s} />
        ))}
      </div>

      {history.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-mint text-2xl font-extrabold tracking-tight text-[#0E2318]">Vorige edities</h2>
          {history.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
