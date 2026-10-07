/**
 * Round-robin poule scheduling, shared courts.
 *
 * Note on round count: for 3 poules of 5 teams sharing 5 courts, a complete
 * round robin is 3 * C(5,2) = 30 matches. At 5 concurrent courts that is a
 * hard minimum of ceil(30/5) = 6 court-rounds with zero idle courts — not 5.
 * Every team getting exactly 4 matches (required below, and by the spec's own
 * test list) is only possible at 5 courts if rounds >= 6. This module always
 * computes the round count that actually fits every match in; callers should
 * derive the real event timing from `roundsCount`, not assume 5.
 */

export interface PouleInput {
  label: string;
  teamIds: string[];
}

export interface ScheduledPouleMatch {
  /** Wall-clock court round, 1-based, shared across all poules. */
  round: number;
  /** This poule's own round-robin round, 1-based (what "Ronde N" means in the UI). */
  pouleRound: number;
  /** Court number, 1-based. */
  court: number;
  pouleLabel: string;
  teamAId: string;
  teamBId: string;
}

export interface PouleScheduleResult {
  matches: ScheduledPouleMatch[];
  roundsCount: number;
  /** Teams in `pouleLabel` not scheduled to play in wall-clock `round`. */
  restingTeamIds(round: number, pouleLabel: string): string[];
}

export interface RoundRobinRound {
  pairs: Array<[string, string]>;
  byeTeamId: string | null;
}

const BYE = "__BYE__";

/**
 * Standard circle-method round robin. For n teams this produces n rounds if n
 * is even, or n rounds (with one bye per round) if n is odd — every pair
 * occurs exactly once, no team plays twice in the same round.
 */
export function roundRobinRounds(teamIds: string[]): RoundRobinRound[] {
  if (teamIds.length < 2) return [];

  const isOdd = teamIds.length % 2 === 1;
  const ids = isOdd ? [...teamIds, BYE] : [...teamIds];
  const m = ids.length;
  const roundsCount = m - 1;
  const fixed = ids[0]!;
  let rotating = ids.slice(1);

  const rounds: RoundRobinRound[] = [];
  for (let r = 0; r < roundsCount; r++) {
    const arranged = [fixed, ...rotating];
    const pairs: Array<[string, string]> = [];
    let byeTeamId: string | null = null;

    for (let i = 0; i < m / 2; i++) {
      const a = arranged[i]!;
      const b = arranged[m - 1 - i]!;
      if (a === BYE) byeTeamId = b;
      else if (b === BYE) byeTeamId = a;
      else pairs.push([a, b]);
    }
    rounds.push({ pairs, byeTeamId });

    rotating = [rotating[rotating.length - 1]!, ...rotating.slice(0, -1)];
  }
  return rounds;
}

interface PouleQueueState {
  label: string;
  teamIds: string[];
  /** Queue of this poule's own rounds, each an array of 1-2 remaining pairs. */
  remaining: Array<Array<[string, string]>>;
  /** 1-based internal round number of `remaining[0]`. */
  nextPouleRound: number;
}

/**
 * Picks the poule schedule for the event. Default is packPouleSchedule (every
 * court full every round). When that leaves teams playing back-to-back and
 * alternatingPouleSchedule fits in at most one extra round, the alternating
 * schedule wins instead: the organizer's rule is no back-to-backs, and one
 * extra 20-minute round is the accepted price for it.
 */
export function generatePouleSchedule(
  poules: PouleInput[],
  courts: number
): PouleScheduleResult {
  if (courts < 1) throw new Error("courts must be >= 1");

  const packed = packPouleSchedule(poules, courts);
  const alternating = alternatingPouleSchedule(poules, courts);
  if (
    alternating &&
    hasBackToBack(packed.matches) &&
    alternating.roundsCount <= packed.roundsCount + 1
  ) {
    return alternating;
  }
  return packed;
}

/**
 * The baannummers the event actually plays on, read off the poule schedule:
 * 1..totalCourts normally, but 2-5 when the alternating schedule leaves baan
 * 1 idle all poulefase (it isn't booked). Falls back to 1..totalCourts before
 * poules exist.
 */
export function playedCourts(result: PouleScheduleResult, totalCourts: number): number[] {
  const used = [...new Set(result.matches.map((m) => m.court))].sort((a, b) => a - b);
  return used.length > 0 ? used : Array.from({ length: totalCourts }, (_, i) => i + 1);
}

/** True if any team plays in two consecutive wall-clock rounds. */
export function hasBackToBack(matches: ScheduledPouleMatch[]): boolean {
  const roundsByTeam = new Map<string, Set<number>>();
  for (const m of matches) {
    for (const id of [m.teamAId, m.teamBId]) {
      const rounds = roundsByTeam.get(id) ?? new Set<number>();
      if (rounds.has(m.round - 1) || rounds.has(m.round + 1)) return true;
      rounds.add(m.round);
      roundsByTeam.set(id, rounds);
    }
  }
  return false;
}

/**
 * Splits the poules into two halves that take turns: the first half plays
 * wall-clock rounds 1, 3, 5, ..., the second half 2, 4, 6, ... — so no team
 * ever plays two rounds in a row. Each poule plays one of its own
 * round-robin rounds per turn. Costs at most one extra round over packing
 * every court (e.g. 4 poules of 4: 6 rounds instead of 5), which
 * generatePouleSchedule accepts in exchange for zero back-to-backs.
 *
 * Only `matchesPerRound` of the courts are used each round, taken from the
 * top (court `courts` downwards), so the idle court is baan 1 — the same
 * "worst court sits idle" convention as BRACKET_DEFINITION's kwartfinales.
 *
 * Returns null when the shape doesn't fit: fewer than 2 poules, the two
 * halves needing a different number of turns (the longer half would then
 * play back-to-back at the end), or a half needing more courts than exist.
 */
export function alternatingPouleSchedule(
  poules: PouleInput[],
  courts: number
): PouleScheduleResult | null {
  if (poules.length < 2) return null;
  const half = Math.ceil(poules.length / 2);
  const groups = [poules.slice(0, half), poules.slice(half)];
  const groupRounds = groups.map((g) => g.map((p) => roundRobinRounds(p.teamIds)));
  const turns = groupRounds.map((g) => Math.max(0, ...g.map((rounds) => rounds.length)));
  if (turns[0] !== turns[1] || turns[0] === 0) return null;

  const matches: ScheduledPouleMatch[] = [];
  const resting = new Map<string, string[]>();
  const roundsCount = turns[0]! * 2;

  for (let round = 1; round <= roundsCount; round++) {
    const groupIndex = (round - 1) % 2;
    const turn = Math.floor((round - 1) / 2);
    const group = groups[groupIndex]!;
    const roundPairs = group.flatMap((p, i) =>
      (groupRounds[groupIndex]![i]![turn]?.pairs ?? []).map((pair) => ({ poule: p, pair }))
    );
    if (roundPairs.length > courts) return null;

    const firstCourt = courts - roundPairs.length + 1;
    roundPairs.forEach(({ poule, pair: [teamAId, teamBId] }, i) => {
      matches.push({ round, pouleRound: turn + 1, court: firstCourt + i, pouleLabel: poule.label, teamAId, teamBId });
    });

    for (const p of poules) {
      const busy = new Set(matches.filter((m) => m.round === round && m.pouleLabel === p.label).flatMap((m) => [m.teamAId, m.teamBId]));
      resting.set(`${round}|${p.label}`, p.teamIds.filter((id) => !busy.has(id)));
    }
  }

  return {
    matches,
    roundsCount,
    restingTeamIds: (r, pouleLabel) => resting.get(`${r}|${pouleLabel}`) ?? [],
  };
}

/**
 * Packs each poule's internal round robin onto `courts` shared courts,
 * filling every court every wall-clock round whenever matches are ready for
 * it. A poule's own matches are only ever drawn in internal-round order (so
 * two matches sharing a wall-clock round always come from the same internal
 * round and are guaranteed to be team-disjoint) — this guarantees no team is
 * ever double-booked within a round, for any number of poules/courts.
 */
function packPouleSchedule(poules: PouleInput[], courts: number): PouleScheduleResult {
  const queues: PouleQueueState[] = poules.map((p) => ({
    label: p.label,
    teamIds: p.teamIds,
    remaining: roundRobinRounds(p.teamIds).map((r) => [...r.pairs]),
    nextPouleRound: 1,
  }));

  const matches: ScheduledPouleMatch[] = [];
  const resting = new Map<string, string[]>();

  let round = 0;
  const numPoules = queues.length;
  while (queues.some((q) => q.remaining.length > 0)) {
    round += 1;
    let courtsUsed = 0;
    const busyByPoule = new Map<string, Set<string>>();
    const startOffset = numPoules > 0 ? (round - 1) % numPoules : 0;

    for (let i = 0; i < numPoules; i++) {
      const q = queues[(startOffset + i) % numPoules]!;
      const room = courts - courtsUsed;
      if (room <= 0) continue;
      if (q.remaining.length === 0) continue;

      const front = q.remaining[0]!;
      const takeCount = Math.min(2, room, front.length);
      if (takeCount === 0) continue;

      const busy = busyByPoule.get(q.label) ?? new Set<string>();
      busyByPoule.set(q.label, busy);

      for (let t = 0; t < takeCount; t++) {
        const [teamAId, teamBId] = front.shift()!;
        matches.push({
          round,
          pouleRound: q.nextPouleRound,
          court: courtsUsed + 1,
          pouleLabel: q.label,
          teamAId,
          teamBId,
        });
        busy.add(teamAId);
        busy.add(teamBId);
        courtsUsed += 1;
      }

      if (front.length === 0) {
        q.remaining.shift();
        q.nextPouleRound += 1;
      }
    }

    for (const q of queues) {
      const busy = busyByPoule.get(q.label) ?? new Set<string>();
      const rest = q.teamIds.filter((id) => !busy.has(id));
      resting.set(`${round}|${q.label}`, rest);
    }
  }

  return {
    matches,
    roundsCount: round,
    restingTeamIds: (r, pouleLabel) => resting.get(`${r}|${pouleLabel}`) ?? [],
  };
}
