import { describe, expect, it } from "vitest";
import { buildMatchVideoRows } from "./match-video";
import type { Match } from "./types";

const match: Match = {
  id: "m1",
  eventId: "e1",
  phase: "poule",
  roundNumber: 3,
  courtNumber: 5,
  label: "Poule D · Ronde 3",
  teamAId: "setro",
  teamBId: "dos",
  scoreA: 6,
  scoreB: 3,
  videoUrl: "https://example.com/v",
};

const options = {
  teamNameById: { setro: "De Setro’s", dos: "Dos Guzmanos" },
  pouleStartsAt: new Date("2026-10-11T08:00:00Z"),
  pouleChangeoverMinutes: 5,
  windows: [],
};

describe("buildMatchVideoRows", () => {
  it("keeps the score in title order and judges the accent from the team's side", () => {
    const [row] = buildMatchVideoRows([match], { ...options, perspectiveTeamId: "dos" });
    expect(row?.title).toBe("De Setro’s vs Dos Guzmanos");
    expect(row?.score).toBe("6-3");
    expect(row?.accent).toBe("loss");

    const [winner] = buildMatchVideoRows([match], { ...options, perspectiveTeamId: "setro" });
    expect(winner?.score).toBe("6-3");
    expect(winner?.accent).toBe("win");
  });

  it("has no accent without a perspective team", () => {
    const [row] = buildMatchVideoRows([match], options);
    expect(row?.score).toBe("6-3");
    expect(row?.accent).toBeNull();
  });
});
