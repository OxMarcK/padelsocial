import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { AdminShell } from "@/components/admin/admin-shell";
import { DayBadge } from "@/components/day-badge";
import { fmtWeekday } from "@/lib/share-metadata";
import { PHASE_META } from "@/lib/phases";
import { normalizeSlug, assertValidSlug } from "@/lib/slug";
import { isSlugTaken } from "@/lib/slug-registry";
import type { PadelEvent } from "@/lib/types";

async function createEvent(formData: FormData) {
  "use server";
  await requireAdmin();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(slug);
  if (await isSlugTaken(slug)) {
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
  revalidatePath("/");
  redirect(`/admin/e/${event.id}`);
}

function EventRow({ event }: { event: PadelEvent }) {
  const phase = PHASE_META[event.status];
  const badge =
    event.status === "finished"
      ? null
      : event.status === "draft"
        ? { label: phase.label, className: "bg-mint-net/15 text-mint-ink-muted" }
        : { label: phase.label, className: "bg-mint-lime/20 text-mint-lime-ink" };
  return (
    <Link
      href={`/admin/e/${event.id}`}
      className="flex items-center gap-4 rounded-[20px] bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-[.98]"
    >
      <DayBadge date={event.date} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate font-mint text-lg font-bold text-mint-ink">{event.name}</span>
          {badge ? (
            <span className={`flex-none rounded-full px-2.5 py-1 font-mint text-xs font-bold ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-semibold leading-snug text-mint-lime-ink">
          {fmtWeekday(event.date)} {event.startTime}
        </span>
        <span className="text-sm leading-snug text-mint-ink-muted">{event.location}</span>
      </span>
    </Link>
  );
}

/** Design 6A trial: admin restyled for the light "mint" palette — no canvas reference for these screens, extrapolates the established tokens directly onto the existing layout. */
export default async function AdminHomePage() {
  const email = await requireAdmin();
  const events = await repo.listEvents();
  const upcoming = events.filter((e) => e.status !== "finished");
  const history = events.filter((e) => e.status === "finished");

  return (
    <AdminShell email={email}>
      <h1 className="font-mint text-4xl font-bold text-mint-ink">Events</h1>

      <div className="flex flex-col gap-2">
        <details className="group rounded-[20px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)] open:shadow-[0_4px_14px_rgba(20,35,28,.1)]">
          <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-2.5">
            <DayBadge plus />
            <span className="font-mint text-lg font-bold text-mint-ink">Nieuw event</span>
          </summary>
          <form action={createEvent} className="flex flex-col gap-3 px-4 pb-4 pt-1">
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

        {upcoming.length === 0 ? (
          <p className="text-sm text-mint-ink-muted">Nog geen events.</p>
        ) : (
          upcoming.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>

      {history.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-mint text-2xl font-bold text-mint-ink">Vorige edities</h2>
          {history.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
