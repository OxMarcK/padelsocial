import { describe, expect, it } from "vitest";
import { computeTournamentStats, formatPodiumCaption } from "./tournament-stats";
import type { Match } from "./types";

function match(teamAId: string, teamBId: string, scoreA: number | null, scoreB: number | null): Match {
  return {
    id: `${teamAId}-${teamBId}`,
    eventId: "event_1",
    phase: "poule",
    roundNumber: 1,
    courtNumber: 1,
    label: "Ronde 1",
    teamAId,
    teamBId,
    scoreA,
    scoreB,
    videoUrl: null,
  };
}

const teamNameById = { a: "Team A", b: "Team B", c: "Team C", d: "Team D" };

describe("computeTournamentStats", () => {
  it("counts only fully-scored matches, ignoring unplayed ones", () => {
    const matches = [match("a", "b", 6, 3), match("c", "d", null, null)];
    const stats = computeTournamentStats(matches, teamNameById);
    expect(stats.totalMatches).toBe(1);
    expect(stats.totalGames).toBe(9);
  });

  it("sums games across every scored match", () => {
    const matches = [match("a", "b", 6, 3), match("c", "d", 7, 5)];
    expect(computeTournamentStats(matches, teamNameById).totalGames).toBe(21);
  });

  it("picks the smallest-margin match as closest, winner's score first", () => {
    const matches = [match("a", "b", 6, 0), match("c", "d", 4, 3)];
    const { closestMatch } = computeTournamentStats(matches, teamNameById);
    expect(closestMatch).toEqual({ teamAName: "Team C", teamBName: "Team D", scoreHigh: 4, scoreLow: 3 });
  });

  it("breaks a tied margin by picking the higher-total (longer) match", () => {
    // Both matches have a margin of 1, but a-b's total (11) beats c-d's (5).
    const matches = [match("a", "b", 6, 5), match("c", "d", 3, 2)];
    const { closestMatch } = computeTournamentStats(matches, teamNameById);
    expect(closestMatch).toEqual({ teamAName: "Team A", teamBName: "Team B", scoreHigh: 6, scoreLow: 5 });
  });

  it("returns a null closestMatch when nothing has been scored", () => {
    const stats = computeTournamentStats([match("a", "b", null, null)], teamNameById);
    expect(stats.totalMatches).toBe(0);
    expect(stats.closestMatch).toBeNull();
  });
});

describe("formatPodiumCaption", () => {
  it("returns undefined when there's nothing to recap", () => {
    expect(formatPodiumCaption({ totalMatches: 0, totalGames: 0, closestMatch: null })).toBeUndefined();
  });

  it("names the closest match when one exists", () => {
    const caption = formatPodiumCaption({
      totalMatches: 14,
      totalGames: 187,
      closestMatch: { teamAName: "Team A", teamBName: "Team B", scoreHigh: 7, scoreLow: 6 },
    });
    expect(caption).toBe(
      "14 wedstrijden, 187 games — en de spannendste ging tot 7-6 tussen Team A en Team B. Deze 3 kwamen als beste uit de bus."
    );
  });

  it("falls back to the plain totals when there's no closest match to name", () => {
    const caption = formatPodiumCaption({ totalMatches: 3, totalGames: 20, closestMatch: null });
    expect(caption).toBe("3 wedstrijden, 20 games verder staat het toernooi erop. Deze 3 kwamen als beste uit de bus.");
  });
});
