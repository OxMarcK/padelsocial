import type { Match, PadelEvent, Placement, Poule, PouleLabel, Team, Top8Resolution } from "../types";

export interface CreateEventInput {
  name: string;
  slug: string;
  date: string;
  startTime: string;
  location: string;
  courts: number;
  description: string;
  coverUrl: string | null;
}

export interface NewTeamInput {
  name: string;
  player1Name: string;
  player2Name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface Top8State {
  top8: Top8Resolution;
  placementSeeds: string[];
}

/**
 * The read/write contract every page and Server Action goes through. Two
 * implementations exist — mock-repo.ts (in-memory demo data, used whenever
 * Supabase env vars aren't set) and supabase-repo.ts (real Postgres). Pages
 * never import either implementation directly; see ./index.ts.
 */
export interface DataRepo {
  listEvents(): Promise<PadelEvent[]>;
  getEvent(id: string): Promise<PadelEvent | null>;
  getEventBySlug(slug: string): Promise<PadelEvent | null>;
  createEvent(input: CreateEventInput): Promise<PadelEvent>;
  updateEvent(id: string, patch: Partial<CreateEventInput> & { pointsWin?: number; pointsDraw?: number; pointsLoss?: number }): Promise<PadelEvent>;
  deleteEvent(id: string): Promise<void>;
  advancePhase(eventId: string): Promise<PadelEvent>;
  advancePouleRound(eventId: string): Promise<PadelEvent>;
  finishEvent(eventId: string): Promise<PadelEvent>;
  /**
   * Recomputes and overwrites the stored final ranking from the event's
   * *current* bracket results, without touching its status. finishEvent only
   * ever computes the ranking once, at the moment the event is finished — if
   * a bracket match's score gets entered or corrected afterward (e.g. an
   * event was finished before the halve finales/finales were fully scored),
   * the public results page keeps showing the old (or missing) ranking until
   * this is called.
   */
  recomputePlacements(eventId: string): Promise<Placement[]>;

  listTeams(eventId: string): Promise<Team[]>;
  bulkAddTeams(eventId: string, teams: NewTeamInput[]): Promise<Team[]>;
  updateTeam(eventId: string, teamId: string, name: string): Promise<Team>;
  deleteTeam(eventId: string, teamId: string): Promise<void>;

  listPoules(eventId: string): Promise<Poule[]>;
  savePoules(eventId: string, assignment: Record<PouleLabel, string[]>): Promise<Poule[]>;
  publishPouleMatches(eventId: string): Promise<Match[]>;

  listMatches(eventId: string): Promise<Match[]>;
  recordScore(eventId: string, matchId: string, scoreA: number, scoreB: number): Promise<Match>;
  attachVideo(eventId: string, matchId: string, videoUrl: string | null): Promise<Match>;

  previewTop8(eventId: string): Promise<Top8State>;
  publishTop8(eventId: string, state: Top8State): Promise<void>;
  getTop8(eventId: string): Promise<Top8State | null>;

  listPlacements(eventId: string): Promise<Placement[]>;

  requestMagicLink(email: string): Promise<void>;
  currentAdminEmail(): Promise<string | null>;
  signOut(): Promise<void>;
}
