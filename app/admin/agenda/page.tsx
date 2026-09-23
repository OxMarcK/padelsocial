import Image from "next/image";
import { requireAdmin } from "@/lib/require-admin";
import { siteSettingsRepo } from "@/lib/data/site-settings";
import { agendaLinksRepo } from "@/lib/data/agenda-links";
import { Field } from "@/components/ui/field";
import { Section } from "@/components/admin/section";
import { AdminShell } from "@/components/admin/admin-shell";
import { ActionForm, ActionFormError, SaveButton } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { uploadHeroFlyer, updateHeroFlyerLink, clearHeroFlyer, createAgendaLink, deleteAgendaLink } from "./actions";

/** Own admin route, deliberately not nested under app/admin/e/[id] — the hero flyer
 * promotes whatever the organizer wants on the landing page, independent of any one
 * event or session existing in the admin yet. */
export default async function AdminAgendaPage() {
  const email = await requireAdmin();
  const settings = await siteSettingsRepo.getSiteSettings();
  const agendaLinks = await agendaLinksRepo.listAgendaLinks();

  return (
    <AdminShell email={email}>
      <h1 className="font-mint text-4xl font-bold text-[#0E2318]">Agenda-hero</h1>

      <Section
          title="Flyer"
          subtitle="De afbeelding bovenaan de Agenda-pagina (padelsocial.nl) — los van een specifiek event."
        >
          {settings.heroFlyerUrl ? (
            <Image
              src={settings.heroFlyerUrl}
              alt="Huidige agenda-flyer"
              width={360}
              height={450}
              className="w-40 rounded-2xl object-cover"
            />
          ) : (
            <p className="text-xs text-mint-ink-muted">Nog geen flyer geüpload.</p>
          )}
          <ActionForm action={uploadHeroFlyer} className="flex flex-col gap-3" resetOnSuccess>
            <input
              type="file"
              name="flyer"
              accept="image/*"
              required
              className="text-sm text-[#0E2318] file:mr-3 file:rounded-full file:border-0 file:bg-mint-lime file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#0E2318]"
            />
            <ActionFormError />
            <SaveButton label="Flyer uploaden" savedLabel="Geüpload" />
          </ActionForm>
          {settings.heroFlyerUrl ? (
            <ConfirmButton
              label="Flyer verwijderen"
              confirmText="Flyer en link van de agenda-hero verwijderen?"
              variant="danger"
              size="sm"
              action={clearHeroFlyer}
            />
          ) : null}
        </Section>

        <Section title="Link" subtitle="Waar de flyer naartoe linkt — bijvoorbeeld het inschrijfformulier van het event.">
          <ActionForm action={updateHeroFlyerLink} className="flex flex-col gap-3">
            <Field
              label="URL"
              name="link"
              type="url"
              placeholder="https://event.padelsocial.nl/toernooi-2"
              defaultValue={settings.heroFlyerLink ?? ""}
            />
            <ActionFormError />
            <SaveButton />
          </ActionForm>
        </Section>

        <Section
          title="Externe agenda-items"
          subtitle="Voor het uitzonderlijke geval: een item in de agenda dat naar een externe link verwijst in plaats van een eigen toernooi- of sessiepagina. Wordt getoond in dezelfde donkere stijl als een toernooi."
        >
          {agendaLinks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {agendaLinks.map((link) => (
                <li key={link.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-mint-net/10 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#0E2318]">{link.title}</span>
                    <span className="block text-xs text-mint-ink-muted">
                      {link.date} · {link.startTime} · {link.location}
                    </span>
                  </span>
                  <ConfirmButton
                    label="Verwijderen"
                    icon="✕"
                    confirmText={`"${link.title}" verwijderen uit de agenda?`}
                    variant="danger"
                    size="sm"
                    action={deleteAgendaLink.bind(null, link.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-mint-ink-muted">Nog geen externe agenda-items.</p>
          )}
          <ActionForm action={createAgendaLink} className="flex flex-col gap-3" resetOnSuccess>
            <Field label="Titel" name="title" placeholder="Padel Clinic bij Partner X" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum" name="date" type="date" required />
              <Field label="Starttijd" name="startTime" type="time" required />
            </div>
            <Field label="Locatie" name="location" placeholder="Padelclub Rotterdam" required />
            <Field label="Link" name="link" type="url" placeholder="https://..." required />
            <ActionFormError />
            <SaveButton label="Item toevoegen" savedLabel="Toegevoegd" />
        </ActionForm>
      </Section>
    </AdminShell>
  );
}
