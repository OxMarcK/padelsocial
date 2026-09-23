import Image from "next/image";
import { requireAdmin } from "@/lib/require-admin";
import { siteSettingsRepo } from "@/lib/data/site-settings";
import { agendaLinksRepo, type AgendaLink } from "@/lib/data/agenda-links";
import { Field } from "@/components/ui/field";
import { AdminShell } from "@/components/admin/admin-shell";
import { DayBadge } from "@/components/day-badge";
import { fmtWeekday } from "@/lib/share-metadata";
import { ActionForm, ActionFormError, SaveButton } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { uploadHeroFlyer, updateHeroFlyerLink, clearHeroFlyer, createAgendaLink, deleteAgendaLink } from "./actions";

function AgendaLinkRow({ link }: { link: AgendaLink }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <DayBadge date={link.date} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-mint text-lg font-bold text-[#0E2318]">{link.title}</span>
        <span className="text-sm font-semibold leading-snug text-mint-lime-ink">
          {fmtWeekday(link.date)} {link.startTime}
        </span>
        <span className="truncate text-sm leading-snug text-mint-ink-muted">{link.location}</span>
      </span>
      <ConfirmButton
        label="Verwijderen"
        icon="✕"
        confirmText={`"${link.title}" verwijderen uit de agenda?`}
        variant="danger"
        size="sm"
        action={deleteAgendaLink.bind(null, link.id)}
      />
    </div>
  );
}

/** Own admin route, deliberately not nested under app/admin/e/[id] — the hero flyer
 * promotes whatever the organizer wants on the landing page, independent of any one
 * event or session existing in the admin yet. */
export default async function AdminAgendaPage() {
  const email = await requireAdmin();
  const settings = await siteSettingsRepo.getSiteSettings();
  const agendaLinks = await agendaLinksRepo.listAgendaLinks();

  return (
    <AdminShell email={email}>
      <h1 className="font-mint text-4xl font-bold text-[#0E2318]">Extra</h1>

      <details className="group rounded-[20px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)] open:shadow-[0_4px_14px_rgba(20,35,28,.1)]">
        <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-2.5">
          {settings.heroFlyerUrl ? (
            <Image
              src={settings.heroFlyerUrl}
              alt="Huidige agenda-flyer"
              width={60}
              height={62}
              className="h-[62px] w-[60px] flex-none rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-[62px] w-[60px] flex-none items-center justify-center rounded-2xl bg-[#EAF1EA] text-xs font-bold text-mint-ink-muted">
              —
            </div>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-mint text-lg font-bold text-[#0E2318]">Flyer &amp; link</span>
            <span className="truncate text-sm text-mint-ink-muted">
              {settings.heroFlyerUrl ? "Flyer geüpload" : "Nog geen flyer geüpload"}
            </span>
          </span>
        </summary>
        <div className="flex flex-col gap-6 px-4 pb-4 pt-1">
          <div className="flex flex-col gap-3">
            <h2 className="font-mint text-sm font-bold uppercase tracking-wider text-mint-ink-muted">Flyer</h2>
            <p className="text-xs text-mint-ink-muted">
              De afbeelding bovenaan de Agenda-pagina (padelsocial.nl) — los van een specifiek event.
            </p>
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
          </div>

          <div className="flex flex-col gap-3 border-t border-mint-net/15 pt-6">
            <h2 className="font-mint text-sm font-bold uppercase tracking-wider text-mint-ink-muted">Link</h2>
            <p className="text-xs text-mint-ink-muted">
              Waar de flyer naartoe linkt — bijvoorbeeld het inschrijfformulier van het event.
            </p>
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
          </div>
        </div>
      </details>

      <div className="flex flex-col gap-2">
        <h2 className="font-mint text-2xl font-bold text-[#0E2318]">Externe agenda item</h2>

        <details className="group rounded-[20px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)] open:shadow-[0_4px_14px_rgba(20,35,28,.1)]">
          <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-2.5">
            <DayBadge plus />
            <span className="font-mint text-lg font-bold text-[#0E2318]">Item toevoegen</span>
          </summary>
          <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
            <p className="text-xs text-mint-ink-muted">
              Voor het uitzonderlijke geval: een item in de agenda dat naar een externe link verwijst in plaats van
              een eigen toernooi- of sessiepagina. Wordt getoond in dezelfde donkere stijl als een toernooi.
            </p>
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
          </div>
        </details>

        {agendaLinks.map((link) => (
          <AgendaLinkRow key={link.id} link={link} />
        ))}
      </div>
    </AdminShell>
  );
}
