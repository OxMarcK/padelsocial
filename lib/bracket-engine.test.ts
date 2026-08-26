import { describe, expect, it } from "vitest";
import { computeTop8Ranking, resolveBracketMatches, resolveTop8, type PouleStandingsInput } from "./bracket-engine";
import type { PouleStandingRow, Top8Resolution } from "./types";

// index0..7 = seed1..seed8, best to worst.
const seeds: Top8Resolution = {
  seeds: ["seed1", "seed2", "seed3", "seed4", "seed5", "seed6", "seed7", "seed8"],
};

describe("resolveBracketMatches — standard bracket seeding (1v8, 4v5, 2v7, 3v6)", () => {
  it("maps every KF to the seed pairing that keeps seed1/seed2 apart until the final", () => {
    const resolved = resolveBracketMatches(seeds, {});
    const byId = Object.fromEntries(resolved.map((m) => [m.id, m]));

    expect([byId.KF1!.teamAId, byId.KF1!.teamBId]).toEqual(["seed1", "seed8"]);
    expect([byId.KF2!.teamAId, byId.KF2!.teamBId]).toEqual(["seed4", "seed5"]);
    expect([byId.KF3!.teamAId, byId.KF3!.teamBId]).toEqual(["seed2", "seed7"]);
    expect([byId.KF4!.teamAId, byId.KF4!.teamBId]).toEqual(["seed3", "seed6"]);

    // downstream rounds have no team yet — nothing has been played
    expect(byId.HF1!.teamAId).toBeNull();
  });
});

describe("resolveBracketMatches — winner/loser propagation through every round", () => {
  const results = {
    KF1: { scoreA: 9, scoreB: 6 }, // seed1 beats seed8
    KF2: { scoreA: 8, scoreB: 7 }, // seed4 beats seed5
    KF3: { scoreA: 10, scoreB: 6 }, // seed2 beats seed7
    KF4: { scoreA: 6, scoreB: 9 }, // seed6 beats seed3
  };
  const resolved = resolveBracketMatches(seeds, results);
  const byId = Object.fromEntries(resolved.map((m) => [m.id, m]));

  it("propagates KF winners into the halve finales", () => {
    expect([byId.HF1!.teamAId, byId.HF1!.teamBId]).toEqual(["seed1", "seed4"]);
    expect([byId.HF2!.teamAId, byId.HF2!.teamBId]).toEqual(["seed2", "seed6"]);
  });

  it("propagates HF winners into the grote finale once round 2 is played", () => {
    const round2Results = {
      ...results,
      HF1: { scoreA: 10, scoreB: 8 }, // seed1 beats seed4
      HF2: { scoreA: 9, scoreB: 7 }, // seed2 beats seed6
    };
    const r2 = resolveBracketMatches(seeds, round2Results);
    const r2ById = Object.fromEntries(r2.map((m) => [m.id, m]));

    expect([r2ById.GRAND!.teamAId, r2ById.GRAND!.teamBId]).toEqual(["seed1", "seed2"]);
  });
});

describe("computeTop8Ranking", () => {
  it("ranks 1-2 off the grote finale, 3-4/5-8 by each loser's original seed once their tier is fully decided", () => {
    const results = {
      KF1: { scoreA: 9, scoreB: 6 }, // seed1 beats seed8
      KF2: { scoreA: 8, scoreB: 7 }, // seed4 beats seed5
      KF3: { scoreA: 10, scoreB: 6 }, // seed2 beats seed7
      KF4: { scoreA: 6, scoreB: 9 }, // seed6 beats seed3
      HF1: { scoreA: 10, scoreB: 8 }, // seed1 beats seed4
      HF2: { scoreA: 9, scoreB: 7 }, // seed2 beats seed6
      GRAND: { scoreA: 12, scoreB: 10 }, // seed1 beats seed2
    };
    const resolved = resolveBracketMatches(seeds, results);
    const ranking = computeTop8Ranking(resolved, seeds);
    expect(ranking).toHaveLength(8);
    const byRank = Object.fromEntries(ranking.map((r) => [r.rank, r.teamId]));
    expect(byRank[1]).toBe("seed1"); // grote finale winner
    expect(byRank[2]).toBe("seed2"); // grote finale loser
    expect(byRank[3]).toBe("seed4"); // halve-finale loser, better seed
    expect(byRank[4]).toBe("seed6"); // halve-finale loser, worse seed
    expect(byRank[5]).toBe("seed3"); // kwartfinale loser, best remaining seed
    expect(byRank[6]).toBe("seed5");
    expect(byRank[7]).toBe("seed7");
    expect(byRank[8]).toBe("seed8"); // kwartfinale loser, worst remaining seed
  });

  it("returns nothing before any tier is fully decided", () => {
    const resolved = resolveBracketMatches(seeds, {});
    expect(computeTop8Ranking(resolved, seeds)).toHaveLength(0);
  });

  it("ranks 5-8 (kwartfinale losers) as soon as all four KFs are in, even before the halve finales are scored", () => {
    const results = {
      KF1: { scoreA: 9, scoreB: 6 }, // seed1 beats seed8
      KF2: { scoreA: 8, scoreB: 7 }, // seed4 beats seed5
      KF3: { scoreA: 10, scoreB: 6 }, // seed2 beats seed7
      KF4: { scoreA: 6, scoreB: 9 }, // seed6 beats seed3
      // HF1/HF2 not yet scored
    };
    const resolved = resolveBracketMatches(seeds, results);
    const ranking = computeTop8Ranking(resolved, seeds);
    const byRank = Object.fromEntries(ranking.map((r) => [r.rank, r.teamId]));
    expect(ranking).toHaveLength(4);
    expect(byRank[5]).toBe("seed3");
    expect(byRank[6]).toBe("seed5");
    expect(byRank[7]).toBe("seed7");
    expect(byRank[8]).toBe("seed8");
  });
});

function row(teamId: string, points: number, saldo: number, gamesFor = 0): PouleStandingRow {
  return { teamId, played: 4, won: 0, drawn: 0, lost: 0, points, gamesFor, gamesAgainst: gamesFor - saldo, saldo };
}

describe("resolveTop8 — 3 poules (reduces to the spec's original 3+3+2 shape)", () => {
  const poulesStandings: PouleStandingsInput[] = [
    {
      label: "A",
      rows: [row("A1", 12, 20), row("A2", 9, 10), row("A3", 7, 5), row("A4", 3, -8), row("A5", 1, -27)],
    },
    {
      label: "B",
      rows: [row("B1", 12, 18), row("B2", 9, 8), row("B3", 6, 2), row("B4", 3, -6), row("B5", 1, -22)],
    },
    {
      label: "C",
      rows: [row("C1", 10, 15), row("C2", 9, 6), row("C3", 4, -1), row("C4", 4, -4), row("C5", 1, -16)],
    },
  ];

  const { top8, placementSeeds } = resolveTop8(poulesStandings);

  it("seeds all 3 winners and all 3 runners-up ahead of any 3rd place, ranked by standings", () => {
    expect(top8.seeds).toEqual(["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3"]);
  });

  it("fills the last 2 of 8 slots with the 2 best 3rd-place teams across poules", () => {
    // thirds: A3(7pt/5), B3(6pt/2), C3(4pt/-1) -> best=A3, 2nd best=B3, excluded=C3
    expect(top8.seeds).toContain("A3");
    expect(top8.seeds).toContain("B3");
    expect(top8.seeds).not.toContain("C3");
  });

  it("placement group is the excluded 3rd plus every 4th/5th place, seeded by standings", () => {
    expect(placementSeeds).toContain("C3");
    expect(placementSeeds).not.toContain("A3");
    expect(placementSeeds).not.toContain("B3");
    expect(placementSeeds).toHaveLength(7);
    // best remaining team (C3, 4pt/-1) should seed above every 4th/5th place team
    expect(placementSeeds[0]).toBe("C3");
  });
});

describe("resolveTop8 — poule-count-agnostic qualification", () => {
  it("with exactly 4 poules, all 8 winners+runners-up qualify and no 3rd place is needed", () => {
    const poules: PouleStandingsInput[] = ["A", "B", "C", "D"].map((label, i) => ({
      label,
      rows: [
        row(`${label}1`, 12, 20 - i),
        row(`${label}2`, 9, 10 - i),
        row(`${label}3`, 6, 2 - i),
        row(`${label}4`, 3, -6 - i),
        row(`${label}5`, 1, -20 - i),
      ],
    }));
    const { top8, placementSeeds } = resolveTop8(poules);
    expect(top8.seeds).toHaveLength(8);
    for (const label of ["A", "B", "C", "D"]) {
      expect(top8.seeds).toContain(`${label}1`);
      expect(top8.seeds).toContain(`${label}2`);
      expect(top8.seeds).not.toContain(`${label}3`);
    }
    expect(placementSeeds).toHaveLength(12); // 4 poules * 3 remaining each
  });

  it("with only 2 poules, digs into 3rd and 4th place to fill all 8 slots", () => {
    const poules: PouleStandingsInput[] = ["A", "B"].map((label, i) => ({
      label,
      rows: [
        row(`${label}1`, 12, 20 - i),
        row(`${label}2`, 9, 10 - i),
        row(`${label}3`, 6, 2 - i),
        row(`${label}4`, 3, -6 - i),
        row(`${label}5`, 1, -20 - i),
      ],
    }));
    const { top8, placementSeeds } = resolveTop8(poules);
    expect(top8.seeds).toHaveLength(8);
    expect(top8.seeds).toEqual(
      expect.arrayContaining(["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"])
    );
    expect(placementSeeds).toHaveLength(2); // just the two 5th places
    expect(placementSeeds).toEqual(["A5", "B5"]);
  });
});
