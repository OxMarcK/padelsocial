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

/** Reads final placement 1-8 straight off the already-fetched, publicly-shaped Match[] (bracketMatchId tags the synthesized bracket rows). */
export function top8RankingFromMatches(matches: Match[]): RankRow[] {
  const byDefId = new Map(matches.filter((m) => m.bracketMatchId).map((m) => [m.bracketMatchId!, m]));
  const ranks: RankRow[] = [];
  const push = (defId: string, hi: number, lo: number) => {
    const r = winnerLoser(byDefId, defId);
    if (r) ranks.push({ teamId: r.winner, rank: hi }, { teamId: r.loser, rank: lo });
  };
  push("GRAND", 1, 2);
  push("BRONZE", 3, 4);
  push("PLACE_5_6", 5, 6);
  push("PLACE_7_8", 7, 8);
  return ranks;
}

/** Same idea for the 7-team placement gauntlet (ranks 9+, best-effort per lib/bracket-engine.ts). */
export function placementRankingFromMatches(matches: Match[], placementSeeds: string[]): RankRow[] {
  const byDefId = new Map(matches.filter((m) => m.bracketMatchId).map((m) => [m.bracketMatchId!, m]));
  const r1 = winnerLoser(byDefId, "R1");
  const r2 = winnerLoser(byDefId, "R2");
  const r3 = winnerLoser(byDefId, "R3");
  const decided = [r1?.winner, r2?.winner, r3?.winner, r3?.loser].filter((id): id is string => !!id);
  const remaining = placementSeeds.filter((id) => !decided.includes(id));
  return [...decided, ...remaining].map((teamId, i) => ({ teamId, rank: 9 + i }));
}
