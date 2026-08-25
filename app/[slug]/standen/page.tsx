import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { resolveBracketMatches, resolveTop8, type PouleStandingsInput } from "@/lib/bracket-engine";
import { PoulesTab } from "./poules-tab";
import { BracketTab } from "./bracket-tab";
import { Logo } from "@/components/logo";
import { EventNav, EVENT_NAV_SPACER_CLASS } from "@/components/event-nav";
import { LivePoll } from "@/components/live-poll";

export default async function StandenPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  const event = await repo.getEventBySlug(params.slug);
  if (!event) notFound();

  const [teams, poules, matches, top8State] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
    repo.getTop8(event.id),
  ]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const pouleStandings = groupStandingsByPoule(poules, matches, event.points);

  const tab = searchParams.tab === "bracket" ? "bracket" : "poules";
  const hasBracket = !!top8State;

  const suggestedTop8 = resolveTop8(pouleStandings as PouleStandingsInput[]);
  const bracketResults: Record<string, { scoreA: number; scoreB: number }> = {};
  for (const m of matches) {
    if (m.bracketMatchId && m.phase !== "plaatsingswedstrijd" && m.scoreA !== null && m.scoreB !== null) {
      bracketResults[m.bracketMatchId] = { scoreA: m.scoreA, scoreB: m.scoreB };
    }
  }
  const resolvedBracket = top8State ? resolveBracketMatches(top8State.top8, bracketResults) : [];

  return (
    <main className={`mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8 ${EVENT_NAV_SPACER_CLASS}`}>
      <LivePoll />
      <Logo />
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide">Standen</h1>

      <div className="flex gap-2 rounded-xl border border-flood-white/10 bg-surface p-1">
        <Link
          href={`/${event.slug}/standen?tab=poules`}
          className={`flex-1 rounded-lg py-2 text-center font-display text-sm font-bold uppercase tracking-wide ${
            tab === "poules" ? "bg-glass-blue text-flood-white" : "text-ink-muted"
          }`}
        >
          Groepsfase
        </Link>
        <Link
          href={`/${event.slug}/standen?tab=bracket`}
          className={`flex-1 rounded-lg py-2 text-center font-display text-sm font-bold uppercase tracking-wide ${
            tab === "bracket" ? "bg-glass-blue text-flood-white" : "text-ink-muted"
          }`}
        >
          Knock-outfase
        </Link>
      </div>

      {tab === "poules" ? (
        <PoulesTab pouleStandings={pouleStandings} teamNameById={teamNameById} top8={suggestedTop8.top8} />
      ) : hasBracket ? (
        <BracketTab resolvedBracket={resolvedBracket} teamNameById={teamNameById} />
      ) : (
        <div className="rounded-2xl border border-flood-white/10 bg-surface p-4 text-sm text-ink-muted">
          De knock-out is nog niet gepubliceerd. Verwachte top 8 op basis van de huidige poulestand staat vast op het
          moment dat de organisator publiceert.
        </div>
      )}
      <EventNav slug={event.slug} active="standen" />
    </main>
  );
}
