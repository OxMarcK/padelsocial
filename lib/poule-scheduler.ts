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
 * Packs each poule's internal round robin onto `courts` shared courts,
 * filling every court every wall-clock round whenever matches are ready for
 * it. A poule's own matches are only ever drawn in internal-round order (so
 * two matches sharing a wall-clock round always come from the same internal
 * round and are guaranteed to be team-disjoint) — this guarantees no team is
 * ever double-booked within a round, for any number of poules/courts.
 */
export function generatePouleSchedule(
  poules: PouleInput[],
  courts: number
): PouleScheduleResult {
  if (courts < 1) throw new Error("courts must be >= 1");

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
