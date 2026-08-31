import type { EventStatus, PadelEvent } from "./types";
import { PHASE_META, PHASE_ORDER } from "./phases";

export interface PhaseWindow {
  status: EventStatus;
  startsAt: Date;
  endsAt: Date | null;
}

/** Every event runs in the Netherlands, regardless of which timezone the server happens to run in. */
const VENUE_TIME_ZONE = "Europe/Amsterdam";

/** Minutes `timeZone`'s wall clock is ahead of UTC at the given instant (DST-aware). */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

/**
 * `event.date`/`event.startTime` are wall-clock values for `VENUE_TIME_ZONE` —
 * "10:30" always means 10:30 in Rotterdam, whatever timezone this code
 * actually executes in (Vercel's Node functions default to UTC). `setHours`
 * sets the *runtime's local* hour, so parsing "10:30" that way is only
 * correct by coincidence when the runtime happens to also be Europe/Amsterdam
 * — it wasn't, which meant every countdown/time-window on the site was off
 * by the CET/CEST offset (1-2 hours). This instead reads the target
 * wall-clock fields directly (no runtime-timezone dependency at all) and
 * shifts by the venue's real DST-aware offset at that date.
 */
function zonedWallClockToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const dateParts = dateStr.split("-").map(Number);
  const timeParts = timeStr.split(":").map(Number);
  const year = dateParts[0] ?? 1970;
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMin = tzOffsetMinutes(new Date(guessUtcMs), timeZone);
  return new Date(guessUtcMs - offsetMin * 60_000);
}

function parseStart(event: PadelEvent): Date {
  return zonedWallClockToUtc(event.date, event.startTime, VENUE_TIME_ZONE);
}

/**
 * The changeover between poule rounds is real time on the clock — the venue's
 * actual 3-hour court booking (10:30–13:30 for the reference 15-team/3-poule
 * event) was worked out to fit a full poule phase + changeovers + the
 * knockout stage, so it has to count, not just be flavor text.
 */
const POULE_ROUND_MINUTES = 20;
const POULE_CHANGEOVER_MINUTES = 2;
/** Fixed lead-in shown as the "voor de start" window before the official start time. */
const DRAFT_LEAD_MINUTES = 30;

/**
 * Advisory schedule assuming every phase runs exactly on time — used only
 * for the phase-indicator's clock/progress bar text. Actual transitions
 * stay admin-triggered (spec §2.3.A): nothing here auto-advances anything.
 * Poulefase duration is `pouleRoundsCount * POULE_ROUND_MINUTES +
 * (pouleRoundsCount - 1) * POULE_CHANGEOVER_MINUTES`, not a hardcoded total —
 * see the doc comment on lib/poule-scheduler.ts for why the round count
 * varies with poule/court shape rather than being a fixed number.
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
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: VENUE_TIME_ZONE });
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
  /** ISO timestamps of the current window — lets the client tick the countdown/progress bar every second instead of only on LivePoll's 20s refresh. */
  countdownStartsAt?: string;
  countdownEndsAt?: string;
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

  // Poulefase ticks per round, not as one block — the whole-phase window can
  // span 3+ rounds, and a countdown that doesn't move until the very last one
  // ends is exactly the "63 minutes left" number nobody can act on, while the
  // subLabel right next to it already says "Ronde 1 van 3". Round advancement
  // stays admin-triggered (advancePouleRound), so this is advisory like the
  // rest of computeSchedule: it assumes the round runs on time and can drift
  // once the admin advances early/late — fmtCountdown floors at 0:00 rather
  // than going negative, so a round running over just reads "time's up"
  // instead of something nonsensical.
  const countdownWindow =
    event.status === "poulefase" ? pouleRoundWindow(current.startsAt, event.currentPouleRound) : current;

  let countdownText: string | undefined;
  let progress: number | undefined;
  let countdownStartsAt: string | undefined;
  let countdownEndsAt: string | undefined;
  if (countdownWindow.endsAt) {
    const totalMs = countdownWindow.endsAt.getTime() - countdownWindow.startsAt.getTime();
    const remainingMs = countdownWindow.endsAt.getTime() - now.getTime();
    countdownText = fmtCountdown(remainingMs);
    progress = totalMs > 0 ? 1 - Math.max(0, remainingMs) / totalMs : 1;
    countdownStartsAt = countdownWindow.startsAt.toISOString();
    countdownEndsAt = countdownWindow.endsAt.toISOString();
  }

  const timeWindowText = countdownWindow.endsAt
    ? `tot ${fmtTime(countdownWindow.endsAt)}`
    : `vanaf ${fmtTime(countdownWindow.startsAt)}`;
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

  return { phaseLabel: meta.label, subLabel, timeWindowText, nextLine, kind, countdownText, progress, countdownStartsAt, countdownEndsAt };
}
