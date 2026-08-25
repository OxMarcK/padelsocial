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
    <main className={`mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8 ${EVENT_NAV_SPACER_CLASS}`}>
      <Logo />
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide">Teams</h1>
      <TeamSearchGrid
        slug={event.slug}
        teams={teams.map((t) => ({ id: t.id, name: t.name, pouleLabel: pouleByTeam.get(t.id) ?? null }))}
      />
      <EventNav slug={event.slug} active="teams" />
    </main>
  );
}
