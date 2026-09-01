import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createSession } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Concept",
  open: "Open voor aanmelden",
  closed: "Gesloten",
  done: "Afgerond",
};

/** Own admin route, deliberately not nested under app/admin/e/** — see the plan's
 * "fully separate from the tournament side" requirement. */
export default async function AdminSessionsPage() {
  await requireAdmin();
  const sessions = await sessionsRepo.listSessions();

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <div>
          <Link href="/admin" className="font-mint text-sm font-bold text-mint-ink-muted hover:text-mint-ink">
            ← Events
          </Link>
          <h1 className="mt-1 font-mint text-4xl font-bold text-mint-ink">Sessies</h1>
        </div>

        <Link
          href="/admin/leden"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-[.98]"
        >
          <span className="font-mint text-lg font-bold text-mint-ink">Leden</span>
          <span className="text-mint-ink-muted">→</span>
        </Link>

        <div className="flex flex-col gap-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-mint-ink-muted">Nog geen sessies. Maak er hieronder een aan.</p>
          ) : (
            sessions.map((s) => (
              <Link
                key={s.id}
                href={`/admin/sessies/${s.id}`}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-[.98]"
              >
                <div>
                  <div className="font-semibold text-mint-ink">{s.title}</div>
                  <div className="text-xs text-mint-ink-muted">
                    {s.date} · {s.startTime} · {s.location}
                  </div>
                </div>
                <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">
                  {STATUS_LABEL[s.status]}
                </span>
              </Link>
            ))
          )}
        </div>

        <details className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <summary className="cursor-pointer font-mint text-lg font-bold text-mint-ink">Nieuwe sessie</summary>
          <form action={createSession} className="mt-4 flex flex-col gap-3">
            <Field label="Titel" name="title" required placeholder="Dinsdagavond padel" />
            <Field label="Slug (voor de URL)" name="slug" required placeholder="dinsdagavond-3-sept" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum" name="date" type="date" required />
              <Field label="Starttijd" name="startTime" type="time" defaultValue="19:00" required />
            </div>
            <Field label="Locatie" name="location" required placeholder="Padelclub Rotterdam" />
            <Field label="Aantal banen" name="courts" type="number" defaultValue={4} required />
            <Field label="Tikkie-link" name="tikkieUrl" placeholder="https://tikkie.me/pay/…" />
            <Button type="submit" fullWidth>
              Sessie aanmaken
            </Button>
          </form>
        </details>
      </main>
    </div>
  );
}
