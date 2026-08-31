/**
 * Top-8 knockout. Zero framework imports.
 *
 * Knock-out is always top-8 regardless of how many poules fed into it (the
 * organizer picks poule count via team count — every poule is 5 teams — but
 * the bracket itself never changes shape). The 8 qualifiers are ranked
 * best-to-worst across *all* poules combined (see resolveTop8) and seeded
 * into the kwartfinales with the standard single-elimination pattern
 * (1v8, 4v5, 2v7, 3v6), which keeps the top 2 seeds apart until the final —
 * except that resolveTop8 will locally reorder seeds to avoid putting two
 * teams from the same poule into the same kwartfinale (see
 * avoidSamePouleKwartfinales): a rematch of a poulefase match nobody asked
 * to see again, decided minutes earlier, in round one of the knockout.
 * Halve finales take the KF winners; the grote finale takes the halve-finale
 * winners and the troostfinale (3e/4e) takes the halve-finale losers, so
 * every podium place is decided by an actual match. There is no wider
 * consolation/placement bracket beyond that — the courts a losing
 * kwartfinale team would otherwise have played on become free play (see the
 * calling pages for the "Vrij te spelen" placeholder), and final ranks 5-8
 * are assigned by each kwartfinale loser's original top-8 seed rather than
 * an extra match (see computeTop8Ranking) — this trades a small amount of
 * ranking precision for fewer matches to register and fewer chances to
 * record a wrong score under time pressure, while keeping the one match
 * (troostfinale) that actually matters for the prijsuitreiking podium.
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

// Baan 4 & 5 are the best courts on-site, so knock-out play (the matches with
// the most eyes on them) is deliberately steered onto them: kwartfinales use
// banen 2-5 (only baan 1 — the worst one — sits idle) and halve
// finales/finales use exactly baan 4 & 5.
export const BRACKET_DEFINITION: BracketMatchDef[] = [
  { id: "KF1", round: 1, court: 2, label: "Kwartfinale 1", phase: "kwartfinale", teamA: seed(0), teamB: seed(7) },
  { id: "KF2", round: 1, court: 3, label: "Kwartfinale 2", phase: "kwartfinale", teamA: seed(3), teamB: seed(4) },
  { id: "KF3", round: 1, court: 4, label: "Kwartfinale 3", phase: "kwartfinale", teamA: seed(1), teamB: seed(6) },
  { id: "KF4", round: 1, court: 5, label: "Kwartfinale 4", phase: "kwartfinale", teamA: seed(2), teamB: seed(5) },
  { id: "HF1", round: 2, court: 4, label: "Halve Finale 1", phase: "halve_finale", teamA: { type: "winnerOf", matchId: "KF1" }, teamB: { type: "winnerOf", matchId: "KF2" } },
  { id: "HF2", round: 2, court: 5, label: "Halve Finale 2", phase: "halve_finale", teamA: { type: "winnerOf", matchId: "KF3" }, teamB: { type: "winnerOf", matchId: "KF4" } },
  { id: "GRAND", round: 3, court: 4, label: "Grote Finale · 1e/2e", phase: "grote_finale", teamA: { type: "winnerOf", matchId: "HF1" }, teamB: { type: "winnerOf", matchId: "HF2" } },
  { id: "BRONZE", round: 3, court: 5, label: "Troostfinale · 3e/4e", phase: "troostfinale", teamA: { type: "loserOf", matchId: "HF1" }, teamB: { type: "loserOf", matchId: "HF2" } },
];

/** Courts a bracket round actually plays a tracked match on — every other court up to `event.courts` is free play. */
export const BRACKET_ROUND_COURTS: Record<1 | 2 | 3, number[]> = {
  1: [2, 3, 4, 5],
  2: [4, 5],
  3: [4, 5],
};

/** The courts in a bracket round with no tracked match — for rendering "Vrij te spelen" placeholders. */
export function freePlayCourts(round: 1 | 2 | 3, totalCourts: number): number[] {
  const tracked = new Set(BRACKET_ROUND_COURTS[round]);
  return Array.from({ length: totalCourts }, (_, i) => i + 1).filter((c) => !tracked.has(c));
}

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

/**
 * Ranks 1-2 come off the grote finale, ranks 3-4 off the troostfinale — the
 * whole podium is match-decided. Ranks 5-8 (kwartfinale losers) have no
 * decisive match, so they're ordered by each team's original top-8 seed
 * instead, once all four kwartfinales are in.
 */
export function computeTop8Ranking(resolved: ResolvedBracketMatch[], seeds: Top8Resolution): RankedTeam[] {
  const byId = new Map(resolved.map((m) => [m.id, m]));
  const grand = byId.get("GRAND");
  const bronze = byId.get("BRONZE");
  const kf = ["KF1", "KF2", "KF3", "KF4"].map((id) => byId.get(id));

  const seedIndex = new Map(seeds.seeds.map((teamId, i) => [teamId, i]));
  const bySeed = (a: string, b: string) => (seedIndex.get(a) ?? Infinity) - (seedIndex.get(b) ?? Infinity);

  const ranks: RankedTeam[] = [];
  if (grand?.winnerId) ranks.push({ teamId: grand.winnerId, rank: 1 });
  if (grand?.loserId) ranks.push({ teamId: grand.loserId, rank: 2 });
  if (bronze?.winnerId) ranks.push({ teamId: bronze.winnerId, rank: 3 });
  if (bronze?.loserId) ranks.push({ teamId: bronze.loserId, rank: 4 });

  if (kf.every((m): m is ResolvedBracketMatch => !!m?.loserId)) {
    kf
      .map((m) => m!.loserId!)
      .sort(bySeed)
      .forEach((teamId, i) => ranks.push({ teamId, rank: 5 + i }));
  }

  return ranks;
}

export interface PouleStandingsInput {
  label: PouleLabel;
  rows: PouleStandingRow[];
}

// Which seed-index pairs actually meet each other in the kwartfinales — must
// stay in sync with BRACKET_DEFINITION's KF1-4 (seed(0)v(7), (3)v(4), (1)v(6), (2)v(5)).
// Exported so tests can assert "no same-poule pair" without hardcoding the pattern twice.
export const KWARTFINALE_SEED_PAIRS: Array<[number, number]> = [
  [0, 7],
  [3, 4],
  [1, 6],
  [2, 5],
];

/**
 * Reassigns 8 rank-ordered qualifiers onto seed slots 0-7 so that no
 * kwartfinale pair (see KWARTFINALE_SEED_PAIRS) is two teams from the same
 * poule — two teams that may well have played each other minutes earlier in
 * the poulefase have no business meeting again in the very first knockout
 * round. This isn't a preference toggle: no organizer wants a rematch that
 * poulefase already decided, so it's just correct default behavior.
 *
 * Branch-and-bound search over the 8! slot assignments, minimizing (in
 * priority order) the number of same-poule kwartfinale pairs, then the total
 * displacement from the natural rank order (so the fix disturbs the fair
 * ranking as little as possible — normally just one local swap). Falls back
 * to the least-bad assignment if a fully clash-free one is impossible (e.g.
 * one poule alone supplies more than half the qualifiers).
 */
function avoidSamePouleKwartfinales(ranked: string[], pouleOfTeam: Map<string, PouleLabel>): string[] {
  const n = ranked.length;
  if (n !== 8) return ranked; // only the standard top-8 bracket shape is defined

  const partnerOfSlot = new Map<number, number>();
  for (const [a, b] of KWARTFINALE_SEED_PAIRS) {
    partnerOfSlot.set(a, b);
    partnerOfSlot.set(b, a);
  }

  const used = new Array<boolean>(n).fill(false);
  const assignment = new Array<string | null>(n).fill(null);
  let best: { assignment: string[]; collisions: number; displacement: number } | null = null;

  function search(slot: number, collisions: number, displacement: number) {
    if (best && (collisions > best.collisions || (collisions === best.collisions && displacement >= best.displacement))) {
      return; // can only get worse or equal-and-no-better from here — prune
    }
    if (slot === n) {
      best = { assignment: assignment.slice() as string[], collisions, displacement };
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      assignment[slot] = ranked[i]!;
      const partner = partnerOfSlot.get(slot);
      const clashesWithPartner =
        partner !== undefined && partner < slot && pouleOfTeam.get(assignment[partner]!) === pouleOfTeam.get(ranked[i]!);
      search(slot + 1, collisions + (clashesWithPartner ? 1 : 0), displacement + Math.abs(slot - i));
      used[i] = false;
      assignment[slot] = null;
    }
  }

  search(0, 0, 0);
  return best!.assignment;
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

  const rankedSeeds = sortStandings(qualifiers).map((r) => r.teamId);
  const pouleOfTeam = new Map(poulesStandings.flatMap((p) => p.rows.map((r) => [r.teamId, p.label] as const)));
  const seeds = avoidSamePouleKwartfinales(rankedSeeds, pouleOfTeam);
  const usedIds = new Set(seeds);
  const placementRows = poulesStandings.flatMap((p) => p.rows).filter((r) => !usedIds.has(r.teamId));

  // The non-qualifiers never play another tracked match (their courts become
  // free play), so this order — poulefase standing across all poules — is
  // also directly the final ranking for places 9+, not just a seeding.
  return { top8: { seeds }, placementSeeds: sortStandings(placementRows).map((r) => r.teamId) };
}
