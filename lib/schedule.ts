import type { EventStatus, PadelEvent } from "./types";
import { PHASE_META, PHASE_ORDER } from "./phases";

export interface PhaseWindow {
  status: EventStatus;
  startsAt: Date;
  endsAt: Date | null;
}

function parseStart(event: PadelEvent): Date {
  const [h, m] = event.startTime.split(":").map((n) => Number(n));
  const d = new Date(`${event.date}T00:00:00`);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

/**
 * The changeover between poule rounds is real time on the clock — the venue's
 * actual 3-hour court booking (10:30–13:30 for the reference 15-team/3-poule
 * event) was worked out to exactly fit 6 full poule rounds + changeovers +
 * the knockout stage, so it has to count, not just be flavor text.
 */
const POULE_ROUND_MINUTES = 18;
const POULE_CHANGEOVER_MINUTES = 2;
/** Fixed lead-in shown as the "voor de start" window before the official start time. */
const DRAFT_LEAD_MINUTES = 30;

/**
 * Advisory schedule assuming every phase runs exactly on time — used only
 * for the phase-indicator's clock/progress bar text. Actual transitions
 * stay admin-triggered (spec §2.3.A): nothing here auto-advances anything.
 * Poulefase duration is `pouleRoundsCount * 18 min + (pouleRoundsCount - 1) *
 * 2 min changeover`, not a hardcoded total — see the doc comment on
 * lib/poule-scheduler.ts for why the round count can be more than the
 * spec's flavor-text 5 rounds.
 */
export function computeSchedule(event: PadelEvent, pouleRoundsCount: number): PhaseWindow[] {
  const start = parseStart(event);
  const windows: PhaseWindow[] = [];
  let cursor = start;

  for (const status of PHASE_ORDER) {
    if (status === "draft") {
      const startsAt = new Date(cursor.getTime() - DRAFT_LEAD_MINUTES * 60_000);
      windows.push({ status, startsAt, endsAt: cursor });
      continue; // cursor stays at the official start time — poulefase still starts on time
    }
    if (status === "poulefase") {
      const rounds = Math.max(pouleRoundsCount, 1);
      const minutes = rounds * POULE_ROUND_MINUTES + (rounds - 1) * POULE_CHANGEOVER_MINUTES;
      const endsAt = new Date(cursor.getTime() + minutes * 60_000);
      windows.push({ status, startsAt: cursor, endsAt });
      cursor = endsAt;
      continue;
    }
    const meta = PHASE_META[status];
    if (meta.durationMinutes) {
      const endsAt = new Date(cursor.getTime() + meta.durationMinutes * 60_000);
      windows.push({ status, startsAt: cursor, endsAt });
      cursor = endsAt;
    } else {
      windows.push({ status, startsAt: cursor, endsAt: null });
    }
  }
  return windows;
}

/** Estimated wall-clock window for a single poule round, given when the poulefase itself starts. */
export function pouleRoundWindow(pouleStartsAt: Date, round: number): { startsAt: Date; endsAt: Date } {
  const offsetMinutes = Math.max(round - 1, 0) * (POULE_ROUND_MINUTES + POULE_CHANGEOVER_MINUTES);
  const startsAt = new Date(pouleStartsAt.getTime() + offsetMinutes * 60_000);
  const endsAt = new Date(startsAt.getTime() + POULE_ROUND_MINUTES * 60_000);
  return { startsAt, endsAt };
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export function fmtCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface PhaseIndicatorData {
  phaseLabel: string;
  subLabel: string;
  timeWindowText: string;
  nextLine: string;
  kind: "pre" | "live" | "pauze" | "ceremony" | "done";
  countdownText?: string;
  progress?: number;
}

/** Shared by /[slug] and /[slug]/tv so both read the same clock. */
export function phaseIndicatorData(event: PadelEvent, pouleRoundsCount: number, now: Date = new Date()): PhaseIndicatorData {
  const windows = computeSchedule(event, pouleRoundsCount);
  const idx = PHASE_ORDER.indexOf(event.status);
  const current = windows[idx];
  const meta = PHASE_META[event.status];
  const nextWindow = windows[idx + 1];

  if (!current || event.status === "finished") {
    return {
      phaseLabel: meta.label,
      subLabel: "eindstand definitief",
      timeWindowText: current ? `sinds ${fmtTime(current.startsAt)}` : "",
      nextLine: "Tot de volgende editie!",
      kind: "done",
    };
  }

  const kind: PhaseIndicatorData["kind"] = meta.isPauze ? "pauze" : meta.isCeremony ? "ceremony" : meta.showCourts ? "live" : "pre";

  let countdownText: string | undefined;
  let progress: number | undefined;
  if (current.endsAt) {
    const totalMs = current.endsAt.getTime() - current.startsAt.getTime();
    const remainingMs = current.endsAt.getTime() - now.getTime();
    countdownText = fmtCountdown(remainingMs);
    progress = totalMs > 0 ? 1 - Math.max(0, remainingMs) / totalMs : 1;
  }

  const timeWindowText = current.endsAt ? `tot ${fmtTime(current.endsAt)}` : `vanaf ${fmtTime(current.startsAt)}`;
  const subLabel =
    event.status === "poulefase"
      ? `Ronde ${event.currentPouleRound} van ${pouleRoundsCount}`
      : meta.isPauze
        ? "even bijkomen"
        : meta.isCeremony
          ? "banen zijn vrij"
          : kind === "pre"
            ? "nog niet begonnen"
            : "alle banen bezet";

  const nextPhaseLine = nextWindow
    ? `${PHASE_META[nextWindow.status].label} ${nextWindow.endsAt ? `tot ${fmtTime(nextWindow.endsAt)}` : `vanaf ${fmtTime(nextWindow.startsAt)}`}.`
    : "Prijsuitreiking bij de bar.";
  const nextLine =
    event.status === "poulefase" && event.currentPouleRound < pouleRoundsCount
      ? `${POULE_CHANGEOVER_MINUTES} minuten pauze om te wisselen, dan ronde ${event.currentPouleRound + 1}.`
      : nextPhaseLine;

  return { phaseLabel: meta.label, subLabel, timeWindowText, nextLine, kind, countdownText, progress };
}
