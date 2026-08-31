import { generatePouleSchedule } from "../poule-scheduler";
import { resolveBracketMatches, resolveTop8, computeTop8Ranking, type MatchResult } from "../bracket-engine";
import { computeStandings } from "../standings";
import { nextStatus, prevStatus } from "../phases";
import type { Match, PadelEvent, Placement, Poule, PouleLabel, PublicPlayer, Team } from "../types";
import type { CreateEventInput, DataRepo, NewTeamInput, Top8State } from "./repo";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function player(name: string): PublicPlayer {
  return { id: uid("player"), name };
}

interface BracketState {
  top8: Top8State | null;
  results: Partial<Record<string, MatchResult>>;
}

interface MatchExtras {
  videoUrl: string | null;
}

class MockStore {
  events = new Map<string, PadelEvent>();
  teams = new Map<string, Team>();
  poules = new Map<string, Poule>();
  pouleMatches = new Map<string, Match>();
  bracket = new Map<string, BracketState>();
  extras = new Map<string, MatchExtras>();
  placements = new Map<string, Placement[]>();
  /** Demo mode: requesting a magic link logs you in immediately, no email sent. */
  adminEmail: string | null = null;
}

// module-singleton so state survives across requests within the same dev server process
const store: MockStore = (globalThis as any).__padelSocialMockStore ?? new MockStore();
(globalThis as any).__padelSocialMockStore = store;

function requireEvent(eventId: string): PadelEvent {
  const event = store.events.get(eventId);
  if (!event) throw new Error(`Event not found: ${eventId}`);
  return event;
}

function bracketStateFor(eventId: string): BracketState {
  let state = store.bracket.get(eventId);
  if (!state) {
    state = { top8: null, results: {} };
    store.bracket.set(eventId, state);
  }
  return state;
}

function teamsForEvent(eventId: string): Team[] {
  return Array.from(store.teams.values()).filter((t) => t.eventId === eventId);
}

function poulesForEvent(eventId: string): Poule[] {
  return Array.from(store.poules.values())
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function pouleMatchesForEvent(eventId: string): Match[] {
  return Array.from(store.pouleMatches.values()).filter((m) => m.eventId === eventId);
}

function standingsByPoule(eventId: string): Map<PouleLabel, ReturnType<typeof computeStandings>> {
  const event = requireEvent(eventId);
  const poules = poulesForEvent(eventId);
  const matches = pouleMatchesForEvent(eventId);
  const map = new Map<PouleLabel, ReturnType<typeof computeStandings>>();
  for (const poule of poules) {
    const pouleMatches = matches
      .filter((m) => m.pouleId === poule.id)
      .map((m) => ({ teamAId: m.teamAId!, teamBId: m.teamBId!, scoreA: m.scoreA, scoreB: m.scoreB }));
    map.set(poule.label, computeStandings(poule.teamIds, pouleMatches, event.points));
  }
  return map;
}

function synthesizeBracketMatches(eventId: string): Match[] {
  const state = bracketStateFor(eventId);
  if (!state.top8) return [];
  const resolved = resolveBracketMatches(state.top8.top8, state.results);
  return resolved.map((m) => {
    const id = `${eventId}:bracket:${m.id}`;
    return {
      id,
      eventId,
      phase: m.phase,
      roundNumber: m.round,
      courtNumber: m.court,
      label: m.label,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      videoUrl: store.extras.get(id)?.videoUrl ?? null,
      bracketMatchId: m.id,
    } satisfies Match;
  });
}

function parseSyntheticId(matchId: string): { eventId: string; kind: "bracket"; defId: string } | null {
  const parts = matchId.split(":");
  if (parts.length !== 3) return null;
  const [eventId, kind, defId] = parts;
  if (kind !== "bracket") return null;
  return { eventId: eventId!, kind, defId: defId! };
}

export const mockRepo: DataRepo = {
  async listEvents() {
    return Array.from(store.events.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getEvent(id) {
    return store.events.get(id) ?? null;
  },

  async getEventBySlug(slug) {
    return Array.from(store.events.values()).find((e) => e.slug === slug) ?? null;
  },

  async createEvent(input: CreateEventInput) {
    const event: PadelEvent = {
      id: uid("event"),
      slug: input.slug,
      name: input.name,
      date: input.date,
      startTime: input.startTime,
      location: input.location,
      courts: input.courts,
      description: input.description,
      coverUrl: input.coverUrl,
      status: "draft",
      points: { win: 3, draw: 1, loss: 0 },
      // Defaults nudged up from the original fixed 2/4/2/2 constants — the first real
      // event ran those too tight (see PadelEvent.schedule doc comment). Still just a
      // starting point: the organizer edits these per event in Instellingen.
      schedule: {
        pouleChangeoverMinutes: 3,
        pauzeAfterPoulefaseMinutes: 5,
        pauzeAfterKwartfinaleMinutes: 3,
        pauzeAfterHalveFinaleMinutes: 3,
      },
      currentPouleRound: 1,
      createdAt: new Date().toISOString(),
    };
    store.events.set(event.id, event);
    return event;
  },

  async updateEvent(id, patch) {
    const event = requireEvent(id);
    const updated: PadelEvent = {
      ...event,
      ...patch,
      points: {
        win: patch.pointsWin ?? event.points.win,
        draw: patch.pointsDraw ?? event.points.draw,
        loss: patch.pointsLoss ?? event.points.loss,
      },
      schedule: {
        pouleChangeoverMinutes: patch.pouleChangeoverMinutes ?? event.schedule.pouleChangeoverMinutes,
        pauzeAfterPoulefaseMinutes: patch.pauzeAfterPoulefaseMinutes ?? event.schedule.pauzeAfterPoulefaseMinutes,
        pauzeAfterKwartfinaleMinutes: patch.pauzeAfterKwartfinaleMinutes ?? event.schedule.pauzeAfterKwartfinaleMinutes,
        pauzeAfterHalveFinaleMinutes: patch.pauzeAfterHalveFinaleMinutes ?? event.schedule.pauzeAfterHalveFinaleMinutes,
      },
    };
    store.events.set(id, updated);
    return updated;
  },

  async deleteEvent(eventId) {
    store.events.delete(eventId);
    for (const [id, t] of store.teams) if (t.eventId === eventId) store.teams.delete(id);
    for (const [id, p] of store.poules) if (p.eventId === eventId) store.poules.delete(id);
    for (const [id, m] of store.pouleMatches) if (m.eventId === eventId) store.pouleMatches.delete(id);
    store.bracket.delete(eventId);
    store.placements.delete(eventId);
  },

  async advancePhase(eventId) {
    const event = requireEvent(eventId);
    const next = nextStatus(event.status);
    if (!next) return event;
    const updated: PadelEvent = { ...event, status: next };
    store.events.set(eventId, updated);
    return updated;
  },

  async regressPhase(eventId) {
    const event = requireEvent(eventId);
    const prev = prevStatus(event.status);
    if (!prev) return event;
    const updated: PadelEvent = { ...event, status: prev };
    store.events.set(eventId, updated);
    return updated;
  },

  async advancePouleRound(eventId) {
    const event = requireEvent(eventId);
    const schedule = generatePouleSchedule(
      poulesForEvent(eventId).map((p) => ({ label: p.label, teamIds: p.teamIds })),
      event.courts
    );
    const nextRound = Math.min(event.currentPouleRound + 1, schedule.roundsCount || 1);
    const updated: PadelEvent = { ...event, currentPouleRound: nextRound };
    store.events.set(eventId, updated);
    return updated;
  },

  async finishEvent(eventId) {
    const event = requireEvent(eventId);
    const state = bracketStateFor(eventId);
    const results: Placement[] = [];
    if (state.top8) {
      const resolved = resolveBracketMatches(state.top8.top8, state.results);
      for (const r of computeTop8Ranking(resolved, state.top8.top8)) {
        results.push({ id: uid("placement"), eventId, teamId: r.teamId, finalRank: r.rank });
      }
      state.top8.placementSeeds.forEach((teamId, i) => {
        results.push({ id: uid("placement"), eventId, teamId, finalRank: 9 + i });
      });
    }
    store.placements.set(eventId, results);
    const updated: PadelEvent = { ...event, status: "finished" };
    store.events.set(eventId, updated);
    return updated;
  },

  async recomputePlacements(eventId) {
    requireEvent(eventId);
    const state = bracketStateFor(eventId);
    const results: Placement[] = [];
    if (state.top8) {
      const resolved = resolveBracketMatches(state.top8.top8, state.results);
      for (const r of computeTop8Ranking(resolved, state.top8.top8)) {
        results.push({ id: uid("placement"), eventId, teamId: r.teamId, finalRank: r.rank });
      }
      state.top8.placementSeeds.forEach((teamId, i) => {
        results.push({ id: uid("placement"), eventId, teamId, finalRank: 9 + i });
      });
    }
    store.placements.set(eventId, results);
    return results;
  },

  async listTeams(eventId) {
    return teamsForEvent(eventId).sort((a, b) => a.name.localeCompare(b.name));
  },

  async bulkAddTeams(eventId, teams: NewTeamInput[]) {
    requireEvent(eventId);
    const created: Team[] = [];
    for (const input of teams) {
      const team: Team = {
        id: uid("team"),
        eventId,
        name: input.name,
        player1: player(input.player1Name),
        player2: player(input.player2Name),
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
      };
      store.teams.set(team.id, team);
      created.push(team);
    }
    return created;
  },

  async updateTeam(_eventId, teamId, name) {
    const team = store.teams.get(teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);
    const updated = { ...team, name };
    store.teams.set(teamId, updated);
    return updated;
  },

  async deleteTeam(eventId, teamId) {
    store.teams.delete(teamId);
    for (const [id, m] of store.pouleMatches) {
      if (m.eventId === eventId && (m.teamAId === teamId || m.teamBId === teamId)) store.pouleMatches.delete(id);
    }
    for (const [id, poule] of store.poules) {
      if (poule.eventId === eventId && poule.teamIds.includes(teamId)) {
        store.poules.set(id, { ...poule, teamIds: poule.teamIds.filter((tid) => tid !== teamId) });
      }
    }
  },

  async listPoules(eventId) {
    return poulesForEvent(eventId);
  },

  async savePoules(eventId, assignment) {
    requireEvent(eventId);
    for (const [id, poule] of store.poules) {
      if (poule.eventId === eventId) store.poules.delete(id);
    }
    const created: Poule[] = [];
    for (const label of Object.keys(assignment) as PouleLabel[]) {
      const poule: Poule = { id: uid("poule"), eventId, label, teamIds: assignment[label] ?? [] };
      store.poules.set(poule.id, poule);
      created.push(poule);
    }
    return created.sort((a, b) => a.label.localeCompare(b.label));
  },

  async publishPouleMatches(eventId) {
    const event = requireEvent(eventId);
    const poules = poulesForEvent(eventId);
    if (poules.length === 0) throw new Error("Verdeel eerst de teams over de poules.");

    for (const [id, m] of store.pouleMatches) {
      if (m.eventId === eventId) store.pouleMatches.delete(id);
    }

    const schedule = generatePouleSchedule(
      poules.map((p) => ({ label: p.label, teamIds: p.teamIds })),
      event.courts
    );
    const pouleByLabel = new Map<string, Poule>(poules.map((p) => [p.label, p]));

    const created: Match[] = schedule.matches.map((sm) => {
      const poule = pouleByLabel.get(sm.pouleLabel)!;
      const match: Match = {
        id: uid("match"),
        eventId,
        phase: "poule",
        roundNumber: sm.round,
        courtNumber: sm.court,
        label: `Poule ${sm.pouleLabel} · Ronde ${sm.pouleRound}`,
        teamAId: sm.teamAId,
        teamBId: sm.teamBId,
        scoreA: null,
        scoreB: null,
        videoUrl: null,
        pouleId: poule.id,
      };
      store.pouleMatches.set(match.id, match);
      return match;
    });

    return created;
  },

  async listMatches(eventId) {
    requireEvent(eventId);
    return [...pouleMatchesForEvent(eventId), ...synthesizeBracketMatches(eventId)].sort(
      (a, b) => a.roundNumber - b.roundNumber || a.courtNumber - b.courtNumber
    );
  },

  async recordScore(eventId, matchId, scoreA, scoreB) {
    const synthetic = parseSyntheticId(matchId);
    if (synthetic) {
      const state = bracketStateFor(synthetic.eventId);
      state.results[synthetic.defId] = { scoreA, scoreB };
      const all = await mockRepo.listMatches(synthetic.eventId);
      const updated = all.find((m) => m.id === matchId);
      if (!updated) throw new Error("Match not found after score update");
      return updated;
    }

    const match = store.pouleMatches.get(matchId);
    if (!match) throw new Error(`Match not found: ${matchId}`);
    const updated = { ...match, scoreA, scoreB };
    store.pouleMatches.set(matchId, updated);
    return updated;
  },

  async attachVideo(_eventId, matchId, videoUrl) {
    store.extras.set(matchId, { videoUrl });
    const match = store.pouleMatches.get(matchId);
    if (match) {
      const updated = { ...match, videoUrl };
      store.pouleMatches.set(matchId, updated);
      return updated;
    }
    const all = await mockRepo.listMatches(_eventId);
    const found = all.find((m) => m.id === matchId);
    if (!found) throw new Error(`Match not found: ${matchId}`);
    return found;
  },

  async previewTop8(eventId) {
    const byPoule = standingsByPoule(eventId);
    const poulesStandings = Array.from(byPoule.entries()).map(([label, rows]) => ({ label, rows }));
    return resolveTop8(poulesStandings);
  },

  async publishTop8(eventId, state) {
    const bracket = bracketStateFor(eventId);
    bracket.top8 = state;
  },

  async getTop8(eventId) {
    return bracketStateFor(eventId).top8;
  },

  async listPlacements(eventId) {
    return store.placements.get(eventId) ?? [];
  },

  async requestMagicLink(email) {
    store.adminEmail = email;
  },

  async currentAdminEmail() {
    return store.adminEmail;
  },

  async signOut() {
    store.adminEmail = null;
  },
};

