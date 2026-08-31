import type { Match } from "./types";

export interface ClosestMatch {
  teamAName: string;
  teamBName: string;
  /** Winner's games first, so the text always reads "7-6", never "6-7". */
  scoreHigh: number;
  scoreLow: number;
}

export interface TournamentStats {
  totalMatches: number;
  /** Sum of every recorded score — the app calls this unit "games" throughout
   * (see the score-stepper's "Meer games voor {team}" label), never "sets" or
   * "punten"; each match is a single game count, not multiple sets. */
  totalGames: number;
  /** Smallest margin, poule or knock-out; ties on margin fall back to the
   * longer (higher-total) match as the more dramatic one to name-check. Null
   * only when nothing has been scored yet. */
  closestMatch: ClosestMatch | null;
}

/** Recap stats for the finished-event podium caption — see lib/match-video.ts for
 * the sibling "video recap" reducer this mirrors in spirit. */
export function computeTournamentStats(matches: Match[], teamNameById: Record<string, string>): TournamentStats {
  const scored = matches.filter(
    (m): m is Match & { teamAId: string; teamBId: string; scoreA: number; scoreB: number } =>
      m.teamAId !== null && m.teamBId !== null && m.scoreA !== null && m.scoreB !== null
  );

  const totalMatches = scored.length;
  const totalGames = scored.reduce((sum, m) => sum + m.scoreA + m.scoreB, 0);

  let closest: (typeof scored)[number] | null = null;
  let closestMargin = Infinity;
  let closestTotal = -Infinity;
  for (const m of scored) {
    const margin = Math.abs(m.scoreA - m.scoreB);
    const total = m.scoreA + m.scoreB;
    if (margin < closestMargin || (margin === closestMargin && total > closestTotal)) {
      closest = m;
      closestMargin = margin;
      closestTotal = total;
    }
  }

  const closestMatch: ClosestMatch | null = closest
    ? {
        teamAName: teamNameById[closest.teamAId] ?? "?",
        teamBName: teamNameById[closest.teamBId] ?? "?",
        scoreHigh: Math.max(closest.scoreA, closest.scoreB),
        scoreLow: Math.min(closest.scoreA, closest.scoreB),
      }
    : null;

  return { totalMatches, totalGames, closestMatch };
}

/** Caption for the finished-event podium — undefined when there's nothing to recap
 * (no scored matches), so the caller can just skip the divider line entirely. */
export function formatPodiumCaption(stats: TournamentStats): string | undefined {
  if (stats.totalMatches === 0) return undefined;
  const base = `${stats.totalMatches} wedstrijden, ${stats.totalGames} games`;
  if (!stats.closestMatch) return `${base} verder staat het toernooi erop. Deze 3 kwamen als beste uit de bus.`;
  const { teamAName, teamBName, scoreHigh, scoreLow } = stats.closestMatch;
  return `${base} — en de spannendste ging tot ${scoreHigh}-${scoreLow} tussen ${teamAName} en ${teamBName}. Deze 3 kwamen als beste uit de bus.`;
}
