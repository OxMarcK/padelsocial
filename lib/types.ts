export type EventStatus =
  | "draft"
  | "poulefase"
  | "pauze_1"
  | "finale_ronde_1"
  | "pauze_2"
  | "finale_ronde_2"
  | "pauze_3"
  | "finale_ronde_3"
  | "prijsuitreiking"
  | "finished";

export interface PointsConfig {
  win: number;
  draw: number;
  loss: number;
}

/**
 * How much changeover time to plan between phases — advisory only (drives the
 * displayed schedule/countdown; actual progression is always admin-triggered,
 * see lib/schedule.ts). Editable per event because the right number depends
 * on the venue/format: the first real event ran these too tight, so instead
 * of guessing a better global constant this is now the organizer's call.
 */
export interface ScheduleConfig {
  /** Between poule rounds. */
  pouleChangeoverMinutes: number;
  /** The "Pauze" before kwartfinales start, right after poulefase ends. */
  pauzeAfterPoulefaseMinutes: number;
  /** The "Pauze" before halve finales start, right after kwartfinales end. */
  pauzeAfterKwartfinaleMinutes: number;
  /** The "Pauze" before de grote finale starts, right after halve finales end. */
  pauzeAfterHalveFinaleMinutes: number;
}

export interface PadelEvent {
  id: string;
  slug: string;
  name: string;
  date: string;
  startTime: string;
  location: string;
  courts: number;
  coverUrl: string | null;
  status: EventStatus;
  points: PointsConfig;
  schedule: ScheduleConfig;
  /** Wall-clock round within the poulefase (1-based). Poulefase has no break
   *  between rounds, so this advances independently of `status`. */
  currentPouleRound: number;
  createdAt: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  player1: PublicPlayer;
  player2: PublicPlayer;
  contactEmail: string | null;
  contactPhone: string | null;
}

/** A single uppercase letter, "A", "B", "C", ... — as many poules as `teams / 5` calls for. */
export type PouleLabel = string;

export interface Poule {
  id: string;
  eventId: string;
  label: PouleLabel;
  teamIds: string[];
}

export type MatchPhase = "poule" | "kwartfinale" | "halve_finale" | "grote_finale" | "troostfinale";

export interface Match {
  id: string;
  eventId: string;
  phase: MatchPhase;
  roundNumber: number;
  courtNumber: number;
  label: string;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  videoUrl: string | null;
  pouleId?: string;
  bracketMatchId?: string;
}

export interface BracketSlot {
  id: string;
  eventId: string;
  label: string;
  resolvedTeamId: string | null;
}

export interface Placement {
  id: string;
  eventId: string;
  teamId: string;
  finalRank: number | null;
}

export interface PouleStandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  gamesFor: number;
  gamesAgainst: number;
  saldo: number;
}

/**
 * The 8 knockout qualifiers, ranked best (index 0) to worst (index 7) across
 * *all* poules combined — poule-count-agnostic, since knock-out is always
 * top-8 regardless of how many poules fed into it. Kwartfinale pairing uses
 * standard bracket seeding (1v8, 4v5, 2v7, 3v6) against this order.
 */
export interface Top8Resolution {
  seeds: string[];
}
