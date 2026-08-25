import type { EventStatus } from "./types";

export const PHASE_ORDER: EventStatus[] = [
  "draft",
  "poulefase",
  "pauze_1",
  "finale_ronde_1",
  "pauze_2",
  "finale_ronde_2",
  "pauze_3",
  "finale_ronde_3",
  "prijsuitreiking",
  "finished",
];

export interface PhaseMeta {
  status: EventStatus;
  label: string;
  isPauze: boolean;
  isCeremony: boolean;
  showCourts: boolean;
  /** minutes, only meaningful for phases with a fixed duration (finale rounds + pauzes) */
  durationMinutes: number | null;
  advanceCta: string | null;
}

export const PHASE_META: Record<EventStatus, PhaseMeta> = {
  draft: { status: "draft", label: "Opzetten", isPauze: false, isCeremony: false, showCourts: false, durationMinutes: null, advanceCta: "Start poulefase" },
  poulefase: { status: "poulefase", label: "Poulefase", isPauze: false, isCeremony: false, showCourts: true, durationMinutes: null, advanceCta: "Naar pauze" },
  pauze_1: { status: "pauze_1", label: "Pauze", isPauze: true, isCeremony: false, showCourts: false, durationMinutes: 10, advanceCta: "Start kwartfinales" },
  finale_ronde_1: { status: "finale_ronde_1", label: "Ronde 1 Finales", isPauze: false, isCeremony: false, showCourts: true, durationMinutes: 20, advanceCta: "Naar pauze" },
  pauze_2: { status: "pauze_2", label: "Pauze", isPauze: true, isCeremony: false, showCourts: false, durationMinutes: 5, advanceCta: "Start halve finales" },
  finale_ronde_2: { status: "finale_ronde_2", label: "Ronde 2 Finales", isPauze: false, isCeremony: false, showCourts: true, durationMinutes: 20, advanceCta: "Naar pauze" },
  pauze_3: { status: "pauze_3", label: "Pauze", isPauze: true, isCeremony: false, showCourts: false, durationMinutes: 5, advanceCta: "Start grote finale" },
  finale_ronde_3: { status: "finale_ronde_3", label: "Ronde 3 Finales", isPauze: false, isCeremony: false, showCourts: true, durationMinutes: 20, advanceCta: "Naar prijsuitreiking" },
  prijsuitreiking: { status: "prijsuitreiking", label: "Prijsuitreiking", isPauze: false, isCeremony: true, showCourts: false, durationMinutes: null, advanceCta: "Evenement afronden" },
  finished: { status: "finished", label: "Afgerond", isPauze: false, isCeremony: false, showCourts: false, durationMinutes: null, advanceCta: null },
};

export function nextStatus(status: EventStatus): EventStatus | null {
  const idx = PHASE_ORDER.indexOf(status);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1] ?? null;
}

export function phaseMeta(status: EventStatus): PhaseMeta {
  return PHASE_META[status];
}

export function isLivePlayPhase(status: EventStatus): boolean {
  return phaseMeta(status).showCourts;
}

const BRACKET_ROUND_PHASE: Partial<Record<EventStatus, 1 | 2 | 3>> = {
  finale_ronde_1: 1,
  finale_ronde_2: 2,
  finale_ronde_3: 3,
};

export function bracketRoundForStatus(status: EventStatus): 1 | 2 | 3 | null {
  return BRACKET_ROUND_PHASE[status] ?? null;
}
