import Link from "next/link";
import { notFound } from "next/navigation";
import { repo } from "@/lib/data";
import { groupStandingsByPoule } from "@/lib/standings";
import { resolveBracketMatches, resolveTop8, type PouleStandingsInput } from "@/lib/bracket-engine";
import { PoulesTab } from "./poules-tab";
import { BracketTab } from "./bracket-tab";
import { Logo } from "@/components/logo";
import { EventNav } from "@/components/mint/event-nav";
import { EVENT_NAV_SPACER_CLASS } from "@/lib/event-nav-spacer";
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
    if (m.bracketMatchId && m.scoreA !== null && m.scoreB !== null) {
      bracketResults[m.bracketMatchId] = { scoreA: m.scoreA, scoreB: m.scoreB };
    }
  }
  const resolvedBracket = top8State ? resolveBracketMatches(top8State.top8, bracketResults) : [];

  return (
    <div
      className={`min-h-screen font-mint text-mint-ink ${EVENT_NAV_SPACER_CLASS}`}
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <LivePoll />
      <header className="sticky top-0 z-10 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Logo variant="light" />
          <h1 className="font-mint text-2xl font-bold text-mint-ink">Standen</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
        <div className="flex gap-2 rounded-full bg-white p-1 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
          <Link
            href={`/${event.slug}/standen?tab=poules`}
            className={`flex-1 rounded-full py-2 text-center font-mint text-sm font-bold ${
              tab === "poules" ? "bg-glass-blue text-white" : "text-mint-ink-muted"
            }`}
          >
            Groepsfase
          </Link>
          <Link
            href={`/${event.slug}/standen?tab=bracket`}
            className={`flex-1 rounded-full py-2 text-center font-mint text-sm font-bold ${
              tab === "bracket" ? "bg-glass-blue text-white" : "text-mint-ink-muted"
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
          <div className="rounded-[24px] bg-white p-4 text-sm text-mint-ink-muted shadow-[0_1px_3px_rgba(20,35,28,.08)]">
            De knock-out is nog niet gepubliceerd. Verwachte top 8 op basis van de huidige poulestand staat vast op het
            moment dat de organisator publiceert.
          </div>
        )}
        <EventNav slug={event.slug} active="standen" />
      </main>
    </div>
  );
}
