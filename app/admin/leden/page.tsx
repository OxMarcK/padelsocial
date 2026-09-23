import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, SaveButton } from "@/components/admin/action-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { DayBadge } from "@/components/day-badge";
import { Field } from "@/components/ui/field";
import type { Member } from "@/lib/session-types";
import { addMembersBulk, deleteMember, updateMember } from "./actions";

const LEVEL_LABEL = { beginner: "Beginner", beginner_plus: "Beginner+", intermediate: "Intermediate" } as const;

function MemberRow({ member }: { member: Member }) {
  return (
    <details className="group rounded-[20px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)] open:shadow-[0_4px_14px_rgba(20,35,28,.1)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-mint text-lg font-bold text-[#0E2318]">{member.name}</span>
          {member.email ? <span className="truncate text-sm leading-snug text-mint-ink-muted">{member.email}</span> : null}
        </span>
        {member.level ? (
          <span className="flex-none rounded-full bg-mint-net/15 px-2.5 py-1 font-mint text-xs font-bold text-mint-ink-muted">
            {LEVEL_LABEL[member.level]}
          </span>
        ) : null}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
        <ActionForm action={updateMember.bind(null, member.id)} className="flex flex-col gap-3">
          <Field label="Naam" name="name" defaultValue={member.name} required />
          <Field label="E-mail" name="email" type="email" defaultValue={member.email ?? ""} />
          <label className="flex flex-col gap-1.5">
            <span className="font-mint text-xs font-bold uppercase tracking-wider text-mint-ink-muted">Niveau</span>
            <select
              name="level"
              defaultValue={member.level ?? ""}
              className="h-12 rounded-[14px] border border-mint-net/25 bg-mint-bg-2 px-4 text-[#0E2318]"
            >
              <option value="">Geen niveau</option>
              {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <SaveButton />
            <ConfirmButton
              label="Verwijderen"
              icon="✕"
              confirmText={`"${member.name}" verwijderen?`}
              action={deleteMember.bind(null, member.id)}
              variant="danger"
              size="sm"
              successMessage="Profiel verwijderd."
            />
          </div>
        </ActionForm>
      </div>
    </details>
  );
}

/**
 * The roster the public aanmeldpagina's dropdown draws from — separate from the
 * tournament's per-event teams/players, on purpose (see the plan's isolation
 * requirement).
 */
export default async function AdminMembersPage() {
  const email = await requireAdmin();
  const members = await sessionsRepo.listMembers();

  return (
    <AdminShell email={email}>
      <div>
        <h1 className="font-mint text-4xl font-extrabold tracking-tight text-[#0E2318]">Profielen</h1>
        <p className="text-sm text-mint-ink-muted">Dit is de lijst waaruit de aanmeldpagina kiest.</p>
      </div>

      <div className="flex flex-col gap-2">
        <details className="group rounded-[20px] bg-white shadow-[0_1px_3px_rgba(20,35,28,.08)] open:shadow-[0_4px_14px_rgba(20,35,28,.1)]">
          <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-2.5">
            <DayBadge plus />
            <span className="font-mint text-lg font-bold text-[#0E2318]">Profiel toevoegen</span>
          </summary>
          <div className="flex flex-col gap-2 px-4 pb-4 pt-1">
            <ActionForm action={addMembersBulk} className="flex flex-col gap-2" resetOnSuccess>
              <textarea
                name="bulk"
                rows={4}
                placeholder={"Eén naam per regel is genoeg:\nSanne Jansen\nJoep de Boer"}
                className="rounded-[14px] border border-mint-net/25 bg-mint-bg-2 px-3 py-2 text-sm text-[#0E2318] placeholder:text-mint-ink-muted/50"
              />
              <p className="text-xs text-mint-ink-muted">
                E-mail en telefoon zijn optioneel — voeg ze toe met &quot;|&quot; als je ze hebt: Sanne Jansen |
                sanne@mail.nl | 0612345678. Anders is een naam per regel genoeg.
              </p>
              <SaveButton label="Profiel toevoegen" savedLabel="Toegevoegd" />
            </ActionForm>
          </div>
        </details>

        {members.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
    </AdminShell>
  );
}
