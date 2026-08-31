import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { getEventCached } from "@/lib/data/cached";
import { Field } from "@/components/ui/field";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, ActionFormError, SaveButton } from "@/components/admin/action-form";
import { Section } from "@/components/admin/section";
import { deleteEvent, duplicateEvent, updateEventDetails } from "../actions";
import { normalizeSlug } from "@/lib/slug";

/** Config that's touched once at setup and then rarely again — its own route so it's
 * out of the way of the Scores page an admin actually lives in during the event. */
export default async function AdminEventSettingsPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const event = await getEventCached(params.id);
  if (!event) notFound();

  return (
    <>
      <Section title="Event bewerken">
        <ActionForm action={updateEventDetails.bind(null, event.id)} className="flex flex-col gap-3">
          <Field label="Naam" name="name" defaultValue={event.name} required />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-mint-ink-muted">Slug (voor de URL)</span>
            <input
              name="slug"
              defaultValue={event.slug}
              required
              className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
            />
            <span className="text-xs text-mint-ink-muted">
              Publieke link wordt event.padelsocial.nl/{event.slug} — al gedeelde links met de oude slug werken
              hierna niet meer.
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum" name="date" type="date" defaultValue={event.date} required />
            <Field label="Starttijd" name="startTime" type="time" defaultValue={event.startTime} required />
          </div>
          <Field label="Locatie" name="location" defaultValue={event.location} required />
          <Field label="Aantal banen" name="courts" type="number" defaultValue={event.courts} required />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-mint-ink-muted">Omschrijving</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={event.description}
              className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
            />
          </label>
          <ActionFormError />
          <SaveButton />
        </ActionForm>
      </Section>

      <Section title="Dupliceer event">
        <p className="text-xs text-mint-ink-muted">
          Maakt een nieuw event met dezelfde teams en poule-indeling — handig om een fase of het schema te testen
          zonder dit event te raken. Het nieuwe event begint bij Inchecken (nog geen wedstrijden of scores).
        </p>
        <ActionForm action={duplicateEvent.bind(null, event.id)} className="flex flex-col gap-3">
          <Field label="Naam" name="name" defaultValue={`${event.name} (test)`} required />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-mint-ink-muted">Slug (voor de URL)</span>
            <input
              name="slug"
              defaultValue={normalizeSlug(`${event.slug}-test`)}
              required
              className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-mint-ink"
            />
          </label>
          <ActionFormError />
          <SaveButton label="Dupliceren" savedLabel="Gedupliceerd" />
        </ActionForm>
      </Section>

      <Section title="Gevarenzone">
        <ConfirmButton
          label="Event verwijderen"
          confirmText={`"${event.name}" permanent verwijderen? Alle teams, poules en wedstrijden gaan verloren.`}
          action={deleteEvent.bind(null, event.id)}
          variant="danger"
        />
      </Section>
    </>
  );
}
