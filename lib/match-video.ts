import type { Match, MatchPhase } from "./types";
import type { PhaseWindow } from "./schedule";
import { fmtTime, pouleRoundWindow } from "./schedule";

export interface MatchVideoRow {
  id: string;
  videoUrl: string;
  eyebrow: string;
  /** Always "{teamA} vs {teamB}" — used both as the visible title and the link's accessible name. */
  title: string;
  subtitle: string;
  score: string;
  /** Only set when a `perspectiveTeamId` is given — there's no "my team" to judge a global video list by. */
  accent: "win" | "draw" | "loss" | null;
}

const PHASE_EYEBROW: Partial<Record<MatchPhase, string>> = {
  kwartfinale: "Kwartfinale",
  halve_finale: "Halve Finale",
  grote_finale: "Grote Finale",
  troostfinale: "Troostfinale",
};

const PHASE_SORT_ORDER: Record<MatchPhase, number> = {
  poule: 0,
  kwartfinale: 1,
  halve_finale: 2,
  grote_finale: 3,
  troostfinale: 3,
};

/**
 * Builds display-ready rows for the "video's terugkijken" list shared by the
 * team card and the eindstand page. Only matches with a video actually
 * attached are included — nothing to play otherwise.
 */
export function buildMatchVideoRows(
  matches: Match[],
  options: {
    teamNameById: Record<string, string>;
    /** poulefase's own start time (windows.find(w => w.status === "poulefase")!.startsAt) — needed to place poule matches on the clock. */
    pouleStartsAt: Date;
    /** event.schedule.pouleChangeoverMinutes — needed alongside pouleStartsAt to place poule matches on the clock. */
    pouleChangeoverMinutes: number;
    /** Full computeSchedule(event, realRoundsCount) result — needed to place bracket-round matches on the clock. */
    windows: PhaseWindow[];
    /** Given, the score/accent/title become relative to this team instead of a neutral "A vs B". */
    perspectiveTeamId?: string;
  }
): MatchVideoRow[] {
  const { teamNameById, pouleStartsAt, pouleChangeoverMinutes, windows, perspectiveTeamId } = options;

  return matches
    .filter((m): m is Match & { videoUrl: string; teamAId: string; teamBId: string; scoreA: number; scoreB: number } =>
      Boolean(m.videoUrl && m.teamAId && m.teamBId && m.scoreA !== null && m.scoreB !== null)
    )
    .sort((a, b) => PHASE_SORT_ORDER[a.phase] - PHASE_SORT_ORDER[b.phase] || a.roundNumber - b.roundNumber || a.courtNumber - b.courtNumber)
    .map((m) => {
      const teamAName = teamNameById[m.teamAId] ?? "?";
      const teamBName = teamNameById[m.teamBId] ?? "?";
      const eyebrow = m.phase === "poule" ? m.label : PHASE_EYEBROW[m.phase] ?? m.label;

      const startsAt =
        m.phase === "poule"
          ? pouleRoundWindow(pouleStartsAt, m.roundNumber, pouleChangeoverMinutes).startsAt
          : windows.find((w) => w.status === `finale_ronde_${m.roundNumber}`)?.startsAt ?? null;
      const subtitle = startsAt ? `Baan ${m.courtNumber} · ${fmtTime(startsAt)}` : `Baan ${m.courtNumber}`;

      let score = `${m.scoreA}-${m.scoreB}`;
      let accent: MatchVideoRow["accent"] = null;
      if (perspectiveTeamId) {
        const isTeamA = m.teamAId === perspectiveTeamId;
        const myScore = isTeamA ? m.scoreA : m.scoreB;
        const oppScore = isTeamA ? m.scoreB : m.scoreA;
        score = `${myScore}-${oppScore}`;
        accent = myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw";
      }

      return {
        id: m.id,
        videoUrl: m.videoUrl,
        eyebrow,
        title: `${teamAName} vs ${teamBName}`,
        subtitle,
        score,
        accent,
      };
    });
}
