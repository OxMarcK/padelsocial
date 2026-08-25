import type { Match, PointsConfig, Poule, PouleStandingRow } from "./types";

export interface StandingsMatchInput {
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
}

/** Pure poule-standings computation. No framework imports. */
export function computeStandings(
  teamIds: string[],
  matches: StandingsMatchInput[],
  points: PointsConfig
): PouleStandingRow[] {
  const rows = new Map<string, PouleStandingRow>();
  for (const teamId of teamIds) {
    rows.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      saldo: 0,
    });
  }

  for (const m of matches) {
    if (m.scoreA === null || m.scoreB === null) continue;
    const a = rows.get(m.teamAId);
    const b = rows.get(m.teamBId);
    if (!a || !b) continue;

    a.played += 1;
    b.played += 1;
    a.gamesFor += m.scoreA;
    a.gamesAgainst += m.scoreB;
    b.gamesFor += m.scoreB;
    b.gamesAgainst += m.scoreA;

    if (m.scoreA > m.scoreB) {
      a.won += 1;
      a.points += points.win;
      b.lost += 1;
      b.points += points.loss;
    } else if (m.scoreB > m.scoreA) {
      b.won += 1;
      b.points += points.win;
      a.lost += 1;
      a.points += points.loss;
    } else {
      a.drawn += 1;
      b.drawn += 1;
      a.points += points.draw;
      b.points += points.draw;
    }
  }

  for (const row of rows.values()) {
    row.saldo = row.gamesFor - row.gamesAgainst;
  }

  return sortStandings(Array.from(rows.values()));
}

/** points desc, then saldo desc, then games voor desc — the tie-break order the spec specifies. */
export function sortStandings(rows: PouleStandingRow[]): PouleStandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    return b.gamesFor - a.gamesFor;
  });
}

/** Convenience used by every page that needs poule standings: groups matches per poule and computes each. */
export function groupStandingsByPoule(
  poules: Poule[],
  matches: Match[],
  points: PointsConfig
): Array<{ label: Poule["label"]; rows: PouleStandingRow[] }> {
  return poules
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((poule) => ({
      label: poule.label,
      rows: computeStandings(
        poule.teamIds,
        matches
          .filter((m) => m.pouleId === poule.id)
          .map((m) => ({ teamAId: m.teamAId!, teamBId: m.teamBId!, scoreA: m.scoreA, scoreB: m.scoreB })),
        points
      ),
    }));
}
