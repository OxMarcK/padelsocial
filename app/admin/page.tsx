import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PHASE_META } from "@/lib/phases";
import { normalizeSlug, assertValidSlug } from "@/lib/slug";

async function createEvent(formData: FormData) {
  "use server";
  await requireAdmin();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(slug);
  if (await repo.getEventBySlug(slug)) {
    throw new Error(`"${slug}" is al in gebruik door een ander event.`);
  }
  const event = await repo.createEvent({
    name: String(formData.get("name") ?? ""),
    slug,
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? "10:30"),
    location: String(formData.get("location") ?? ""),
    courts: Number(formData.get("courts") ?? 5),
    description: String(formData.get("description") ?? ""),
    coverUrl: null,
  });
  redirect(`/admin/e/${event.id}`);
}

export default async function AdminHomePage() {
  await requireAdmin();
  const events = await repo.listEvents();

  return (
    <div className="min-h-screen bg-court-night">
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide">Events</h1>

      <div className="flex flex-col gap-2">
        {events.length === 0 ? (
          <p className="text-sm text-ink-muted">Nog geen events. Maak er hieronder een aan.</p>
        ) : (
          events.map((e) => (
            <Link
              key={e.id}
              href={`/admin/e/${e.id}`}
              className="flex items-center justify-between rounded-2xl border border-flood-white/10 bg-surface px-4 py-3 hover:bg-flood-white/5"
            >
              <div>
                <div className="font-semibold">{e.name}</div>
                <div className="text-xs text-ink-muted">
                  {e.date} · {e.location}
                </div>
              </div>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-lime-serve">
                {PHASE_META[e.status].label}
              </span>
            </Link>
          ))
        )}
      </div>

      <details className="rounded-2xl border border-flood-white/10 bg-surface p-4">
        <summary className="cursor-pointer font-display text-lg font-bold uppercase tracking-wide">
          Nieuw event
        </summary>
        <form action={createEvent} className="mt-4 flex flex-col gap-3">
          <Field label="Naam" name="name" required placeholder="Padel Social — 30 augustus" />
          <Field label="Slug (voor de URL)" name="slug" required placeholder="padel-social-30-augustus" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum" name="date" type="date" required />
            <Field label="Starttijd" name="startTime" type="time" defaultValue="10:30" required />
          </div>
          <Field label="Locatie" name="location" required placeholder="Rotterdam" />
          <Field label="Aantal banen" name="courts" type="number" defaultValue={5} required />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted">Omschrijving</span>
            <textarea
              name="description"
              rows={3}
              className="rounded-xl border border-flood-white/15 bg-court-night px-3 py-2 text-flood-white"
            />
          </label>
          <Button type="submit" fullWidth>
            Event aanmaken
          </Button>
        </form>
      </details>
    </main>
    </div>
  );
}
