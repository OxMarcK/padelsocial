/**
 * Top-8 knockout + placement track. Zero framework imports.
 *
 * Knock-out is always top-8 regardless of how many poules fed into it (the
 * organizer picks poule count via team count — every poule is 5 teams — but
 * the bracket itself never changes shape). The 8 qualifiers are ranked
 * best-to-worst across *all* poules combined (see resolveTop8) and seeded
 * into the kwartfinales with the standard single-elimination pattern
 * (1v8, 4v5, 2v7, 3v6), which keeps the top 2 seeds apart until the final.
 * Halve finales take the KF winners, verliezersronde takes the KF losers
 * (VR1 = loser KF1 vs loser KF2, VR2 = loser KF3 vs loser KF4); grote
 * finale/troostfinale take the halve-finale winners/losers; the two
 * plaatsingsfinales (5e/6e, 7e/8e) take the verliezersronde winners/losers.
 */

import type { MatchPhase, PouleLabel, PouleStandingRow, Top8Resolution } from "./types";
import { sortStandings } from "./standings";

export type TeamSource =
  | { type: "seed"; index: number }
  | { type: "winnerOf"; matchId: string }
  | { type: "loserOf"; matchId: string };

export interface BracketMatchDef {
  id: string;
  round: 1 | 2 | 3;
  court: number;
  label: string;
  phase: MatchPhase;
  teamA: TeamSource;
  teamB: TeamSource;
}

function seed(index: number): TeamSource {
  return { type: "seed", index };
}

export const BRACKET_DEFINITION: BracketMatchDef[] = [
  { id: "KF1", round: 1, court: 1, label: "Kwartfinale 1", phase: "kwartfinale", teamA: seed(0), teamB: seed(7) },
  { id: "KF2", round: 1, court: 2, label: "Kwartfinale 2", phase: "kwartfinale", teamA: seed(3), teamB: seed(4) },
  { id: "KF3", round: 1, court: 3, label: "Kwartfinale 3", phase: "kwartfinale", teamA: seed(1), teamB: seed(6) },
  { id: "KF4", round: 1, court: 4, label: "Kwartfinale 4", phase: "kwartfinale", teamA: seed(2), teamB: seed(5) },
  { id: "HF1", round: 2, court: 1, label: "Halve Finale 1", phase: "halve_finale", teamA: { type: "winnerOf", matchId: "KF1" }, teamB: { type: "winnerOf", matchId: "KF2" } },
  { id: "HF2", round: 2, court: 2, label: "Halve Finale 2", phase: "halve_finale", teamA: { type: "winnerOf", matchId: "KF3" }, teamB: { type: "winnerOf", matchId: "KF4" } },
  { id: "VR1", round: 2, court: 3, label: "Verliezersronde · 5e-8e", phase: "verliezersronde", teamA: { type: "loserOf", matchId: "KF1" }, teamB: { type: "loserOf", matchId: "KF2" } },
  { id: "VR2", round: 2, court: 4, label: "Verliezersronde · 5e-8e", phase: "verliezersronde", teamA: { type: "loserOf", matchId: "KF3" }, teamB: { type: "loserOf", matchId: "KF4" } },
  { id: "GRAND", round: 3, court: 1, label: "Grote Finale · 1e/2e", phase: "grote_finale", teamA: { type: "winnerOf", matchId: "HF1" }, teamB: { type: "winnerOf", matchId: "HF2" } },
  { id: "BRONZE", round: 3, court: 2, label: "Troostfinale · 3e/4e", phase: "troostfinale", teamA: { type: "loserOf", matchId: "HF1" }, teamB: { type: "loserOf", matchId: "HF2" } },
  { id: "PLACE_5_6", round: 3, court: 3, label: "Plaatsingsfinale · 5e/6e", phase: "plaatsingsfinale", teamA: { type: "winnerOf", matchId: "VR1" }, teamB: { type: "winnerOf", matchId: "VR2" } },
  { id: "PLACE_7_8", round: 3, court: 4, label: "Plaatsingsfinale · 7e/8e", phase: "plaatsingsfinale", teamA: { type: "loserOf", matchId: "VR1" }, teamB: { type: "loserOf", matchId: "VR2" } },
];

export interface MatchResult {
  scoreA: number;
  scoreB: number;
}

export interface ResolvedBracketMatch {
  id: string;
  round: 1 | 2 | 3;
  court: number;
  label: string;
  phase: MatchPhase;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  loserId: string | null;
}

/** Walks BRACKET_DEFINITION in (already topological) order, filling in team ids as far as recorded results allow. */
export function resolveBracketMatches(
  seeds: Top8Resolution,
  results: Partial<Record<string, MatchResult>>
): ResolvedBracketMatch[] {
  const byId = new Map<string, ResolvedBracketMatch>();

  function resolveTeam(source: TeamSource): string | null {
    if (source.type === "seed") return seeds.seeds[source.index] || null;
    const dep = byId.get(source.matchId);
    if (!dep) return null;
    return source.type === "winnerOf" ? dep.winnerId : dep.loserId;
  }

  for (const def of BRACKET_DEFINITION) {
    const teamAId = resolveTeam(def.teamA);
    const teamBId = resolveTeam(def.teamB);
    const result = results[def.id];
    const scoreA = result?.scoreA ?? null;
    const scoreB = result?.scoreB ?? null;
    let winnerId: string | null = null;
    let loserId: string | null = null;
    if (teamAId && teamBId && scoreA !== null && scoreB !== null && scoreA !== scoreB) {
      if (scoreA > scoreB) {
        winnerId = teamAId;
        loserId = teamBId;
      } else {
        winnerId = teamBId;
        loserId = teamAId;
      }
    }
    byId.set(def.id, { id: def.id, round: def.round, court: def.court, label: def.label, phase: def.phase, teamAId, teamBId, scoreA, scoreB, winnerId, loserId });
  }

  return BRACKET_DEFINITION.map((d) => byId.get(d.id)!);
}

export interface RankedTeam {
  teamId: string;
  rank: number;
}

/** Only returns ranks whose deciding match has a recorded winner/loser. */
export function computeTop8Ranking(resolved: ResolvedBracketMatch[]): RankedTeam[] {
  const byId = new Map(resolved.map((m) => [m.id, m]));
  const grand = byId.get("GRAND");
  const bronze = byId.get("BRONZE");
  const p56 = byId.get("PLACE_5_6");
  const p78 = byId.get("PLACE_7_8");

  const ranks: RankedTeam[] = [];
  if (grand?.winnerId) ranks.push({ teamId: grand.winnerId, rank: 1 });
  if (grand?.loserId) ranks.push({ teamId: grand.loserId, rank: 2 });
  if (bronze?.winnerId) ranks.push({ teamId: bronze.winnerId, rank: 3 });
  if (bronze?.loserId) ranks.push({ teamId: bronze.loserId, rank: 4 });
  if (p56?.winnerId) ranks.push({ teamId: p56.winnerId, rank: 5 });
  if (p56?.loserId) ranks.push({ teamId: p56.loserId, rank: 6 });
  if (p78?.winnerId) ranks.push({ teamId: p78.winnerId, rank: 7 });
  if (p78?.loserId) ranks.push({ teamId: p78.loserId, rank: 8 });
  return ranks;
}

export interface PouleStandingsInput {
  label: PouleLabel;
  rows: PouleStandingRow[];
}

/**
 * Auto-suggests the top-8 seeding from poulefase standings, per the spec's
 * tie-break order (points, then saldo, then games voor — already applied by
 * sortStandings). The admin UI should show this as an editable draft, since
 * cross-poule tie-breaks (e.g. "2 best 3rd place teams") are exactly the
 * edge case the spec calls out as needing a manual override control.
 *
 * Poule-count-agnostic: every poule winner qualifies first: if that's fewer
 * than 8, the best runners-up (by standings, across all poules) fill the
 * rest, then the best remaining teams of any placing if still short. Only
 * once poule count is high enough that winners alone exceed 8 do we trim
 * down to the best 8 winners instead. With the spec's own 3-poule shape this
 * reduces to exactly "3 winners + 3 runners-up + 2 best thirds" — unchanged.
 */
export function resolveTop8(poulesStandings: PouleStandingsInput[]): { top8: Top8Resolution; placementSeeds: string[] } {
  const winners = poulesStandings.map((p) => p.rows[0]).filter((r): r is PouleStandingRow => !!r);
  const runnersUp = poulesStandings.map((p) => p.rows[1]).filter((r): r is PouleStandingRow => !!r);
  const rest = poulesStandings.flatMap((p) => p.rows.slice(2));

  let qualifiers: PouleStandingRow[];
  if (winners.length >= 8) {
    qualifiers = sortStandings(winners).slice(0, 8);
  } else {
    qualifiers = [...winners];
    const afterRunnersUp = sortStandings(runnersUp).slice(0, 8 - qualifiers.length);
    qualifiers = [...qualifiers, ...afterRunnersUp];
    const afterRest = sortStandings(rest).slice(0, 8 - qualifiers.length);
    qualifiers = [...qualifiers, ...afterRest];
  }

  const seeds = sortStandings(qualifiers).map((r) => r.teamId);
  const usedIds = new Set(seeds);
  const placementRows = poulesStandings.flatMap((p) => p.rows).filter((r) => !usedIds.has(r.teamId));

  return { top8: { seeds }, placementSeeds: sortStandings(placementRows).map((r) => r.teamId) };
}

export interface PlacementLadderMatch {
  id: "R1" | "R2" | "R3";
  round: 1 | 2 | 3;
  label: string;
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
  loserId: string | null;
}

export interface PlacementTrackResult {
  matches: PlacementLadderMatch[];
  /** Best-effort final order for the whole placement group, ranks 9..(8+n). */
  ranking: RankedTeam[];
}

/**
 * The 7-team placement group only gets one court (baan 5) for 3 rounds — not
 * enough matches to fully order 7 teams. Per spec §2.3.B this is an explicit,
 * sanctioned approximation, not a bug. We run it as a 3-round gauntlet seeded
 * by poulefase standings: seed 1 vs seed 2 (round winner is provisionally
 * ranked, the loser challenges the next seed); after 3 rounds the untouched
 * lowest seeds keep their poulefase seed order.
 */
export function resolvePlacementTrack(
  seededTeamIds: string[],
  results: Partial<Record<"R1" | "R2" | "R3", MatchResult>>
): PlacementTrackResult {
  const label = "Plaatsingswedstrijd";
  const seed = (i: number) => seededTeamIds[i] ?? null;

  function playRound(id: "R1" | "R2" | "R3", round: 1 | 2 | 3, roundLabel: string, teamAId: string | null, teamBId: string | null) {
    const result = results[id];
    const scoreA = result?.scoreA ?? null;
    const scoreB = result?.scoreB ?? null;
    let winnerId: string | null = null;
    let loserId: string | null = null;
    if (teamAId && teamBId && scoreA !== null && scoreB !== null && scoreA !== scoreB) {
      if (scoreA > scoreB) {
        winnerId = teamAId;
        loserId = teamBId;
      } else {
        winnerId = teamBId;
        loserId = teamAId;
      }
    }
    const match: PlacementLadderMatch = { id, round, label: roundLabel, teamAId, teamBId, winnerId, loserId };
    return match;
  }

  const r1 = playRound("R1", 1, label, seed(0), seed(1));
  const r2 = playRound("R2", 2, `${label} · vervolg`, r1.loserId, seed(2));
  const r3 = playRound("R3", 3, `${label} · finale`, r2.loserId, seed(3));

  const decided = [r1.winnerId, r2.winnerId, r3.winnerId, r3.loserId].filter(
    (id): id is string => id !== null
  );
  const remaining = seededTeamIds.filter((id) => !decided.includes(id));
  const order = [...decided, ...remaining];

  return {
    matches: [r1, r2, r3],
    ranking: order.map((teamId, i) => ({ teamId, rank: 9 + i })),
  };
}
