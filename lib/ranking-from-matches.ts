import type { Match } from "./types";

export interface RankRow {
  teamId: string;
  rank: number;
}

function winnerLoser(byDefId: Map<string, Match>, defId: string): { winner: string; loser: string } | null {
  const m = byDefId.get(defId);
  if (!m || m.scoreA === null || m.scoreB === null || !m.teamAId || !m.teamBId || m.scoreA === m.scoreB) return null;
  return m.scoreA > m.scoreB ? { winner: m.teamAId, loser: m.teamBId } : { winner: m.teamBId, loser: m.teamAId };
}

/**
 * Reads final placement 1-8 straight off the already-fetched, publicly-shaped
 * Match[] (bracketMatchId tags the synthesized bracket rows). Ranks 1-4 come
 * from the grote finale / troostfinale; 5-8 have no decisive match (see
 * lib/bracket-engine.ts) so they're ordered by `seeds` (the published top-8
 * seed order) instead, and only once every kwartfinale is decided.
 */
export function top8RankingFromMatches(matches: Match[], seeds: string[]): RankRow[] {
  const byDefId = new Map(matches.filter((m) => m.bracketMatchId).map((m) => [m.bracketMatchId!, m]));
  const seedIndex = new Map(seeds.map((id, i) => [id, i]));
  const bySeed = (a: string, b: string) => (seedIndex.get(a) ?? Infinity) - (seedIndex.get(b) ?? Infinity);
  const ranks: RankRow[] = [];

  const grand = winnerLoser(byDefId, "GRAND");
  if (grand) ranks.push({ teamId: grand.winner, rank: 1 }, { teamId: grand.loser, rank: 2 });

  const bronze = winnerLoser(byDefId, "BRONZE");
  if (bronze) ranks.push({ teamId: bronze.winner, rank: 3 }, { teamId: bronze.loser, rank: 4 });

  const kf = ["KF1", "KF2", "KF3", "KF4"].map((id) => winnerLoser(byDefId, id));
  if (kf.every((r): r is { winner: string; loser: string } => !!r)) {
    kf
      .map((r) => r!.loser)
      .sort(bySeed)
      .forEach((teamId, i) => ranks.push({ teamId, rank: 5 + i }));
  }

  return ranks;
}
