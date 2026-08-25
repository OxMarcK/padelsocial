import { describe, expect, it } from "vitest";
import { generatePouleSchedule, roundRobinRounds } from "./poule-scheduler";

function teamIds(prefix: string, n: number) {
  return Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
}

describe("roundRobinRounds", () => {
  it("pairs every team with every other team exactly once (odd n, one bye per round)", () => {
    const teams = teamIds("T", 5);
    const rounds = roundRobinRounds(teams);
    expect(rounds).toHaveLength(5);

    const seenPairs = new Set<string>();
    const byeCounts = new Map<string, number>();
    for (const round of rounds) {
      expect(round.pairs).toHaveLength(2);
      expect(round.byeTeamId).not.toBeNull();
      byeCounts.set(round.byeTeamId!, (byeCounts.get(round.byeTeamId!) ?? 0) + 1);

      const playing = round.pairs.flat();
      expect(new Set(playing).size).toBe(playing.length); // no team twice in a round

      for (const [a, b] of round.pairs) {
        const key = [a, b].sort().join("|");
        expect(seenPairs.has(key)).toBe(false);
        seenPairs.add(key);
      }
    }
    expect(seenPairs.size).toBe(10); // C(5,2)
    for (const team of teams) {
      expect(byeCounts.get(team)).toBe(1); // each team byes exactly once
    }
  });

  it("produces n-1 rounds with no bye for even n", () => {
    const teams = teamIds("T", 4);
    const rounds = roundRobinRounds(teams);
    expect(rounds).toHaveLength(3);
    for (const round of rounds) {
      expect(round.byeTeamId).toBeNull();
      expect(round.pairs).toHaveLength(2);
    }
  });
});

describe("generatePouleSchedule (3 poules of 5, 5 courts)", () => {
  const poules = [
    { label: "A", teamIds: teamIds("A", 5) },
    { label: "B", teamIds: teamIds("B", 5) },
    { label: "C", teamIds: teamIds("C", 5) },
  ];
  const result = generatePouleSchedule(poules, 5);

  it("schedules exactly 4 unique matches per team", () => {
    const perTeam = new Map<string, Set<string>>();
    for (const m of result.matches) {
      for (const [self, opp] of [
        [m.teamAId, m.teamBId],
        [m.teamBId, m.teamAId],
      ] as const) {
        if (!perTeam.has(self)) perTeam.set(self, new Set());
        perTeam.get(self)!.add(opp);
      }
    }
    for (const poule of poules) {
      for (const teamId of poule.teamIds) {
        expect(perTeam.get(teamId)?.size).toBe(4);
      }
    }
  });

  it("never double-books a team within a wall-clock round", () => {
    const byRound = new Map<number, string[]>();
    for (const m of result.matches) {
      const arr = byRound.get(m.round) ?? [];
      arr.push(m.teamAId, m.teamBId);
      byRound.set(m.round, arr);
    }
    for (const [, teams] of byRound) {
      expect(new Set(teams).size).toBe(teams.length);
    }
  });

  it("uses all 5 courts every round with zero idle courts", () => {
    const byRound = new Map<number, number>();
    for (const m of result.matches) {
      byRound.set(m.round, (byRound.get(m.round) ?? 0) + 1);
    }
    expect(byRound.size).toBe(result.roundsCount);
    for (let r = 1; r <= result.roundsCount; r++) {
      expect(byRound.get(r)).toBe(5);
    }
  });

  it("needs 6 wall-clock rounds to fit all 30 matches on 5 courts", () => {
    // 3 * C(5,2) = 30 matches; 30 / 5 courts = 6 — not the 5 the spec's prose
    // implies. See the module doc comment.
    expect(result.matches).toHaveLength(30);
    expect(result.roundsCount).toBe(6);
  });

  it("court assignments within a round are always 1..courtsUsed with no gaps", () => {
    const byRound = new Map<number, number[]>();
    for (const m of result.matches) {
      const arr = byRound.get(m.round) ?? [];
      arr.push(m.court);
      byRound.set(m.round, arr);
    }
    for (const [, courts] of byRound) {
      expect([...courts].sort((a, b) => a - b)).toEqual(
        Array.from({ length: courts.length }, (_, i) => i + 1)
      );
    }
  });

  it("resting teams per round are exactly the poule's teams not scheduled that round", () => {
    for (let r = 1; r <= result.roundsCount; r++) {
      for (const poule of poules) {
        const playing = new Set(
          result.matches
            .filter((m) => m.round === r && m.pouleLabel === poule.label)
            .flatMap((m) => [m.teamAId, m.teamBId])
        );
        const rest = result.restingTeamIds(r, poule.label);
        expect(new Set(rest).size).toBe(rest.length);
        for (const teamId of rest) expect(playing.has(teamId)).toBe(false);
        expect(rest.length + playing.size).toBe(poule.teamIds.length);
      }
    }
  });
});

describe("generatePouleSchedule generalizes beyond the fixed 3x5x5 case", () => {
  it("handles a single poule alone on its own courts (no idle courts, 5 rounds)", () => {
    const result = generatePouleSchedule([{ label: "A", teamIds: teamIds("A", 5) }], 2);
    expect(result.roundsCount).toBe(5);
    for (const m of result.matches) expect(m.court).toBeLessThanOrEqual(2);
  });
});
