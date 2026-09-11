import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { sessionsRepo } from "@/lib/data/sessions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, SaveButton } from "@/components/admin/action-form";
import { Section } from "@/components/admin/section";
import { addMembersBulk, deleteMember, updateMember } from "./actions";

const LEVEL_LABEL = { beginner: "Beginner", beginner_plus: "Beginner+", intermediate: "Intermediate" } as const;

/**
 * The roster the public aanmeldpagina's dropdown draws from — separate from the
 * tournament's per-event teams/players, on purpose (see the plan's isolation
 * requirement). Same bulk-add-textarea UX as Teams, adapted to one person per line.
 */
export default async function AdminMembersPage() {
  await requireAdmin();
  const members = await sessionsRepo.listMembers();

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
          <h1 className="mt-1 font-mint text-4xl font-bold text-mint-ink">Leden</h1>
        </div>

        <Section title="Leden" subtitle={`${members.length} leden — dit is de lijst waaruit de aanmeldpagina kiest`}>
          <ActionForm action={addMembersBulk} className="flex flex-col gap-2" resetOnSuccess>
            <textarea
              name="bulk"
              rows={4}
              placeholder={"Eén naam per regel is genoeg:\nSanne Jansen\nJoep de Boer"}
              className="rounded-xl border border-mint-net/25 bg-white px-3 py-2 text-sm text-mint-ink placeholder:text-mint-ink-muted/60"
            />
            <p className="text-xs text-mint-ink-muted">
              E-mail en telefoon zijn optioneel — voeg ze toe met &quot;|&quot; als je ze hebt: Sanne Jansen |
              sanne@mail.nl | 0612345678. Anders is een naam per regel genoeg.
            </p>
            <SaveButton label="Leden toevoegen" savedLabel="Toegevoegd" />
          </ActionForm>
          {members.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-2 rounded-xl bg-mint-net/10 px-3 py-3 text-sm sm:flex-row sm:items-center sm:py-2"
                >
                  <ActionForm
                    action={updateMember.bind(null, m.id)}
                    className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
                  >
                    <input
                      name="name"
                      defaultValue={m.name}
                      placeholder="Naam"
                      className="h-9 w-full min-w-0 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink sm:flex-1"
                    />
                    <input
                      name="email"
                      type="email"
                      defaultValue={m.email ?? ""}
                      placeholder="E-mail"
                      className="h-9 w-full min-w-0 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink sm:flex-1"
                    />
                    <select
                      name="level"
                      defaultValue={m.level ?? ""}
                      className="h-9 w-full rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink sm:w-auto"
                    >
                      <option value="">Geen niveau</option>
                      {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <SaveButton variant="ghost" size="sm" />
                  </ActionForm>
                  <ConfirmButton
                    label="Verwijderen"
                    icon="✕"
                    confirmText={`"${m.name}" verwijderen?`}
                    action={deleteMember.bind(null, m.id)}
                    variant="danger"
                    size="sm"
                    successMessage="Lid verwijderd."
                  />
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      </main>
    </div>
  );
}
