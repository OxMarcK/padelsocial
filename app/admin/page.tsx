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
    coverUrl: null,
  });
  redirect(`/admin/e/${event.id}`);
}

/** Design 6A trial: admin restyled for the light "mint" palette — no canvas reference for these screens, extrapolates the established tokens directly onto the existing layout. */
export default async function AdminHomePage() {
  await requireAdmin();
  const events = await repo.listEvents();

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <h1 className="font-mint text-4xl font-bold text-mint-ink">Events</h1>

        <div className="flex flex-col gap-2">
          {events.length === 0 ? (
            <p className="text-sm text-mint-ink-muted">Nog geen events. Maak er hieronder een aan.</p>
          ) : (
            events.map((e) => (
              <Link
                key={e.id}
                href={`/admin/e/${e.id}`}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-[.98]"
              >
                <div>
                  <div className="font-semibold text-mint-ink">{e.name}</div>
                  <div className="text-xs text-mint-ink-muted">
                    {e.date} · {e.location}
                  </div>
                </div>
                <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-lime-ink">
                  {PHASE_META[e.status].label}
                </span>
              </Link>
            ))
          )}
        </div>

        <details className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <summary className="cursor-pointer font-mint text-lg font-bold text-mint-ink">Nieuw event</summary>
          <form action={createEvent} className="mt-4 flex flex-col gap-3">
            <Field label="Naam" name="name" required placeholder="Padel Social — 30 augustus" />
            <Field label="Slug (voor de URL)" name="slug" required placeholder="padel-social-30-augustus" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum" name="date" type="date" required />
              <Field label="Starttijd" name="startTime" type="time" defaultValue="10:30" required />
            </div>
            <Field label="Locatie" name="location" required placeholder="Rotterdam" />
            <Field label="Aantal banen" name="courts" type="number" defaultValue={5} required />
            <Button type="submit" fullWidth>
              Event aanmaken
            </Button>
          </form>
        </details>
      </main>
    </div>
  );
}
