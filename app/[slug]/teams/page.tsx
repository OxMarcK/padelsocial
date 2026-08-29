import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { Logo } from "@/components/logo";
import { EventNav } from "@/components/event-nav";
import { EVENT_NAV_SPACER_CLASS } from "@/lib/event-nav-spacer";
import { TeamSearchGrid } from "./team-search-grid";

export default async function TeamsPage({ params }: { params: { slug: string } }) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules] = await Promise.all([repo.listTeams(event.id), repo.listPoules(event.id)]);
  const pouleByTeam = new Map<string, string>();
  for (const poule of poules) for (const teamId of poule.teamIds) pouleByTeam.set(teamId, poule.label);

  return (
    <div
      className={`min-h-screen font-mint text-mint-ink ${EVENT_NAV_SPACER_CLASS}`}
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Logo variant="light" />
          <h1 className="font-mint text-2xl font-bold text-mint-ink">Teams</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
        <TeamSearchGrid
          slug={event.slug}
          teams={teams.map((t) => ({ id: t.id, name: t.name, pouleLabel: pouleByTeam.get(t.id) ?? null }))}
        />
        <EventNav slug={event.slug} active="teams" />
      </main>
    </div>
  );
}
