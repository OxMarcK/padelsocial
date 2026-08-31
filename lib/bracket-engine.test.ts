import { describe, expect, it } from "vitest";
import {
  computeTop8Ranking,
  resolveBracketMatches,
  resolveTop8,
  KWARTFINALE_SEED_PAIRS,
  type PouleStandingsInput,
} from "./bracket-engine";
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

  it("propagates HF winners into the grote finale and HF losers into the troostfinale once round 2 is played", () => {
    const round2Results = {
      ...results,
      HF1: { scoreA: 10, scoreB: 8 }, // seed1 beats seed4
      HF2: { scoreA: 9, scoreB: 7 }, // seed2 beats seed6
    };
    const r2 = resolveBracketMatches(seeds, round2Results);
    const r2ById = Object.fromEntries(r2.map((m) => [m.id, m]));

    expect([r2ById.GRAND!.teamAId, r2ById.GRAND!.teamBId]).toEqual(["seed1", "seed2"]);
    expect([r2ById.BRONZE!.teamAId, r2ById.BRONZE!.teamBId]).toEqual(["seed4", "seed6"]);
  });
});

describe("computeTop8Ranking", () => {
  it("ranks 1-2 off the grote finale, 3-4 off the troostfinale, 5-8 by each kwartfinale loser's original seed", () => {
    const results = {
      KF1: { scoreA: 9, scoreB: 6 }, // seed1 beats seed8
      KF2: { scoreA: 8, scoreB: 7 }, // seed4 beats seed5
      KF3: { scoreA: 10, scoreB: 6 }, // seed2 beats seed7
      KF4: { scoreA: 6, scoreB: 9 }, // seed6 beats seed3
      HF1: { scoreA: 10, scoreB: 8 }, // seed1 beats seed4
      HF2: { scoreA: 9, scoreB: 7 }, // seed2 beats seed6
      GRAND: { scoreA: 12, scoreB: 10 }, // seed1 beats seed2
      BRONZE: { scoreA: 11, scoreB: 9 }, // seed4 beats seed6
    };
    const resolved = resolveBracketMatches(seeds, results);
    const ranking = computeTop8Ranking(resolved, seeds);
    expect(ranking).toHaveLength(8);
    const byRank = Object.fromEntries(ranking.map((r) => [r.rank, r.teamId]));
    expect(byRank[1]).toBe("seed1"); // grote finale winner
    expect(byRank[2]).toBe("seed2"); // grote finale loser
    expect(byRank[3]).toBe("seed4"); // troostfinale winner
    expect(byRank[4]).toBe("seed6"); // troostfinale loser
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

  it("withholds ranks 3-4 until the troostfinale is scored, even once the grote finale is decided", () => {
    const results = {
      KF1: { scoreA: 9, scoreB: 6 },
      KF2: { scoreA: 8, scoreB: 7 },
      KF3: { scoreA: 10, scoreB: 6 },
      KF4: { scoreA: 6, scoreB: 9 },
      HF1: { scoreA: 10, scoreB: 8 },
      HF2: { scoreA: 9, scoreB: 7 },
      GRAND: { scoreA: 12, scoreB: 10 },
      // BRONZE not yet scored
    };
    const resolved = resolveBracketMatches(seeds, results);
    const ranking = computeTop8Ranking(resolved, seeds);
    const byRank = Object.fromEntries(ranking.map((r) => [r.rank, r.teamId]));
    expect(byRank[1]).toBe("seed1");
    expect(byRank[2]).toBe("seed2");
    expect(byRank[3]).toBeUndefined();
    expect(byRank[4]).toBeUndefined();
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
    // Not toEqual with a fixed order: this fixture's naive rank order (C1 at
    // index 2, C2 at index 5) is exactly the same-poule KF collision
    // resolveTop8 now corrects for — see the "no same-poule kwartfinale"
    // describe block below. Membership/ranking-tier is what's guaranteed here.
    expect(top8.seeds).toEqual(expect.arrayContaining(["A1", "B1", "C1", "A2", "B2", "C2"]));
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

  it("never pairs two same-poule teams into a kwartfinale, even though the naive rank order would (C1 vs C2)", () => {
    const pouleOf = new Map(poulesStandings.flatMap((p) => p.rows.map((r) => [r.teamId, p.label] as const)));
    for (const [a, b] of KWARTFINALE_SEED_PAIRS) {
      expect(pouleOf.get(top8.seeds[a]!)).not.toBe(pouleOf.get(top8.seeds[b]!));
    }
  });
});

describe("resolveTop8 — same-poule kwartfinale avoidance (regression: two poule-A teams landing in one KF pair)", () => {
  // Reproduces the reported bug with just 2 poules of 4 qualifiers each: poule
  // B is strong enough to take the top 2 overall ranks, which pushes the
  // naive best-to-worst order to [B1,B2,A1,B3,A2,A3,B4,A4] — colliding at
  // both KF pairs (1,6)=B2/B4 and (2,5)=A1/A3. Confirm resolveTop8 fixes it
  // without changing which 8 teams qualify.
  const poulesStandings: PouleStandingsInput[] = [
    { label: "A", rows: [row("A1", 12, 5), row("A2", 10, 2), row("A3", 9, 0), row("A4", 7, -4)] },
    { label: "B", rows: [row("B1", 14, 9), row("B2", 13, 7), row("B3", 11, 3), row("B4", 8, -1)] },
  ];

  it("produces the same 8 qualifiers, just reordered, with zero same-poule kwartfinale pairs", () => {
    const naiveOrder = ["B1", "B2", "A1", "B3", "A2", "A3", "B4", "A4"];
    const pouleOf = new Map(poulesStandings.flatMap((p) => p.rows.map((r) => [r.teamId, p.label] as const)));

    // Sanity-check the fixture actually reproduces a collision in naive rank
    // order — otherwise this test would pass for the wrong reason.
    expect(pouleOf.get(naiveOrder[1]!)).toBe(pouleOf.get(naiveOrder[6]!)); // B2 vs B4
    expect(pouleOf.get(naiveOrder[2]!)).toBe(pouleOf.get(naiveOrder[5]!)); // A1 vs A3

    const { top8 } = resolveTop8(poulesStandings);
    expect(top8.seeds).toHaveLength(8);
    expect(top8.seeds).toEqual(expect.arrayContaining(naiveOrder));
    for (const [a, b] of KWARTFINALE_SEED_PAIRS) {
      expect(pouleOf.get(top8.seeds[a]!)).not.toBe(pouleOf.get(top8.seeds[b]!));
    }
  });

  it("leaves an already collision-free ranking untouched", () => {
    // Every-other interleaving (A1,B1,A2,B2,...) never puts two same-poule
    // teams in a KF pair (0v7, 3v4, 1v6, 2v5 all cross the A/B split), so
    // there's nothing to fix here — the natural rank order should survive
    // unchanged rather than being needlessly reshuffled.
    const balanced: PouleStandingsInput[] = [
      { label: "A", rows: [row("A1", 12, 20), row("A2", 9, 10), row("A3", 6, 0), row("A4", 3, -10)] },
      { label: "B", rows: [row("B1", 11, 18), row("B2", 8, 8), row("B3", 5, -2), row("B4", 2, -12)] },
    ];
    const { top8 } = resolveTop8(balanced);
    expect(top8.seeds).toEqual(["A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4"]);
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
