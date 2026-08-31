import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { generatePouleSchedule } from "@/lib/poule-scheduler";
import { computeSchedule, phaseIndicatorData } from "@/lib/schedule";
import { PHASE_META, bracketRoundForStatus, highestStartedBracketRound, nextStatus, prevStatus } from "@/lib/phases";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ActionForm, SaveButton } from "@/components/admin/action-form";
import { MatchBoard } from "@/components/admin/match-board";
import { Section } from "@/components/admin/section";
import { Top8Editor } from "@/components/admin/top8-editor";
import { PhaseTimeline } from "@/components/mint/phase-timeline";
import { LiveCountdownText } from "@/components/mint/live-countdown";
import { advancePhase, advancePouleRound, attachVideo, recomputePlacements, recordScore, regressPhase } from "./actions";

/** The Scores / control-room view — stepper, phase card, and whatever needs scoring
 * right now. This is the default route (/admin/e/[id]) since it's what an admin looks
 * at all day; Teams & poules and Instellingen are separate, less-visited routes (see
 * layout.tsx's AdminNav). */
export default async function AdminEventScoresPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { round?: string };
}) {
  await requireAdmin();
  const event = await repo.getEvent(params.id);
  if (!event) notFound();

  const [teams, poules, matches, top8] = await Promise.all([
    repo.listTeams(event.id),
    repo.listPoules(event.id),
    repo.listMatches(event.id),
    repo.getTop8(event.id),
  ]);
  const teamNameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const meta = PHASE_META[event.status];
  const next = nextStatus(event.status);
  const previous = prevStatus(event.status);

  const pouleMatches = matches.filter((m) => m.phase === "poule");
  const schedulePreview =
    poules.length > 0
      ? generatePouleSchedule(
          poules.map((p) => ({ label: p.label, teamIds: p.teamIds })),
          event.courts
        )
      : null;

  const windows = computeSchedule(event, schedulePreview?.roundsCount || event.currentPouleRound || 1);
  const indicator = phaseIndicatorData(event, schedulePreview?.roundsCount || event.currentPouleRound || 1);

  const currentRoundMatches = pouleMatches.filter((m) => m.roundNumber === event.currentPouleRound);
  const missingScores = currentRoundMatches.filter((m) => m.scoreA === null || m.scoreB === null).length;
  const pouleRoundsCount = schedulePreview?.roundsCount ?? event.currentPouleRound;
  const requestedRound = Number(searchParams.round);
  const viewedRound =
    requestedRound >= 1 && requestedRound <= pouleRoundsCount ? requestedRound : event.currentPouleRound;
  const viewedRoundMatches = pouleMatches.filter((m) => m.roundNumber === viewedRound);
  const bracketRound = bracketRoundForStatus(event.status);
  const bracketMatches = matches.filter((m) => m.phase !== "poule");
  const currentBracketMatches = bracketRound ? bracketMatches.filter((m) => m.roundNumber === bracketRound) : [];
  const bracketMissingScores = currentBracketMatches.filter((m) => m.scoreA === null || m.scoreB === null).length;
  // Matches from a bracket round that has already started (per the event's own phase
  // history, not just "resolvable") but got skipped over unscored — e.g. the admin
  // advanced the phase before scoring them. Their teams are known but no score was
  // recorded, and since the current round's own matches are just winnerOf/loserOf
  // lookups over the results map, catching these up here is enough to unstick a later
  // round automatically. Gating on "started" (not just "not the current round") matters
  // because a later round's teams can already be resolvable — e.g. HF1 as soon as both
  // its KFs are done — without that round having actually begun yet.
  const startedBracketRound = highestStartedBracketRound(event.status);
  const catchUpBracketMatches = bracketMatches.filter(
    (m) =>
      m.roundNumber <= startedBracketRound &&
      m.roundNumber !== bracketRound &&
      m.teamAId &&
      m.teamBId &&
      (m.scoreA === null || m.scoreB === null)
  );

  const recordScoreBound = recordScore.bind(null, event.id);

  // Not-yet-linked matches float to the top — that's the actual to-do here, and the list
  // only grows over the course of an event, so surfacing what's missing beats chronological order.
  const scoredMatches = matches
    .filter((m) => m.scoreA !== null && m.scoreB !== null)
    .sort((a, b) => Number(!!a.videoUrl) - Number(!!b.videoUrl));
  const videosLinkedCount = scoredMatches.filter((m) => m.videoUrl).length;

  return (
    <>
      <PhaseTimeline windows={windows} currentStatus={event.status} />

      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mint text-lg font-bold text-mint-ink">{indicator.phaseLabel}</div>
            <div className="text-sm text-mint-ink-muted">{indicator.subLabel}</div>
          </div>
          <div className="flex-none text-right text-xs text-mint-ink-muted">{indicator.timeWindowText}</div>
        </div>

        {indicator.countdownText && indicator.countdownStartsAt && indicator.countdownEndsAt ? (
          <div className="mt-3 flex items-baseline gap-2 border-t border-mint-net/15 pt-3">
            <span className="font-mint text-3xl font-bold tabular-nums text-mint-lime-ink">
              <LiveCountdownText
                startsAtIso={indicator.countdownStartsAt}
                endsAtIso={indicator.countdownEndsAt}
                initialText={indicator.countdownText}
              />
            </span>
            <span className="text-xs text-mint-ink-muted">resterend · {indicator.nextLine}</span>
          </div>
        ) : (
          <div className="mt-3 border-t border-mint-net/15 pt-3 text-xs text-mint-ink-muted">{indicator.nextLine}</div>
        )}

        {meta.advanceCta && next ? (
          <div className="mt-4">
            {bracketRound && bracketMissingScores > 0 ? (
              <ConfirmButton
                key={event.status}
                label={meta.advanceCta}
                confirmText={`Nog ${bracketMissingScores} wedstrijd${bracketMissingScores === 1 ? "" : "en"} niet gescoord in ${meta.label.toLowerCase()}. Toch doorgaan?`}
                action={advancePhase.bind(null, event.id, event.status)}
                variant="secondary"
                successMessage="Doorgezet naar de volgende fase."
              />
            ) : (
              <ConfirmButton
                key={event.status}
                label={meta.advanceCta}
                confirmText={confirmTextFor(event.status, teams.length)}
                action={advancePhase.bind(null, event.id, event.status)}
                successMessage="Doorgezet naar de volgende fase."
              />
            )}
          </div>
        ) : null}

        {previous ? (
          <div className={meta.advanceCta && next ? "mt-2" : "mt-4"}>
            <ConfirmButton
              key={`back-${event.status}`}
              label={`← Terug naar ${PHASE_META[previous].label}`}
              confirmText={`Terug naar ${PHASE_META[previous].label}? Gescoorde wedstrijden, de gepubliceerde top 8 en de eindstand blijven bewaard — je kan gewoon weer vooruit. Dit is direct zichtbaar op de publieke pagina's.`}
              action={regressPhase.bind(null, event.id, event.status)}
              variant="ghost"
              size="sm"
              successMessage={`Terug naar ${PHASE_META[previous].label}.`}
            />
          </div>
        ) : null}
      </div>

      {meta.showCourts && event.status === "poulefase" && pouleMatches.length > 0 ? (
        <Section title="Scores invoeren" subtitle={`Ronde ${viewedRound} van ${pouleRoundsCount}`}>
          <div className="flex gap-1 rounded-xl bg-mint-net/10 p-1">
            {Array.from({ length: pouleRoundsCount }, (_, i) => i + 1).map((r) => (
              <Link
                key={r}
                href={`/admin/e/${event.id}?round=${r}`}
                className={`flex-1 rounded-lg py-1.5 text-center font-mint text-xs font-bold ${
                  viewedRound === r ? "bg-mint-lime text-mint-lime-ink" : "text-mint-ink-muted"
                }`}
              >
                Ronde {r}
              </Link>
            ))}
          </div>
          <MatchBoard matches={viewedRoundMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
          {viewedRound === event.currentPouleRound ? (
            missingScores > 0 ? (
              <div className="mt-3">
                <ConfirmButton
                  key={event.currentPouleRound}
                  label="Volgende ronde binnen poulefase"
                  confirmText={`Nog ${missingScores} wedstrijd${missingScores === 1 ? "" : "en"} niet gescoord in ronde ${event.currentPouleRound}. Toch doorgaan naar de volgende ronde?`}
                  action={advancePouleRound.bind(null, event.id, event.currentPouleRound)}
                  variant="secondary"
                  successMessage="Volgende ronde gestart."
                />
              </div>
            ) : (
              <ActionForm
                key={event.currentPouleRound}
                action={advancePouleRound.bind(null, event.id, event.currentPouleRound)}
                className="mt-3"
              >
                <SaveButton
                  variant="ghost"
                  label="Volgende ronde binnen poulefase"
                  savedLabel="Volgende ronde gestart"
                />
              </ActionForm>
            )
          ) : (
            <p className="mt-3 text-xs text-mint-ink-muted">
              Je bekijkt een eerdere ronde. Ga naar ronde {event.currentPouleRound} om door te gaan naar de
              volgende ronde.
            </p>
          )}
        </Section>
      ) : null}

      {event.status === "pauze_1" ? (
        <Section title="Top 8 & plaatsingsgroep" subtitle="Controleer de seeding voordat je publiceert">
          <Top8Editor eventId={event.id} teams={teams} published={top8} />
        </Section>
      ) : null}

      {catchUpBracketMatches.length > 0 ? (
        <Section
          title="Nog niet gescoorde wedstrijden"
          subtitle="Deze zijn overgeslagen doordat de fase al is doorgezet — vul ze alsnog in om de volgende ronde te ontgrendelen"
        >
          <MatchBoard matches={catchUpBracketMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
        </Section>
      ) : null}

      {bracketRound && currentBracketMatches.length > 0 ? (
        <Section title="Scores invoeren" subtitle={meta.label}>
          <MatchBoard matches={currentBracketMatches} teamNameById={teamNameById} onSave={recordScoreBound} />
        </Section>
      ) : null}

      {scoredMatches.length > 0 ? (
        <Section
          title="Video's koppelen"
          subtitle={`${videosLinkedCount} van ${scoredMatches.length} wedstrijden gekoppeld`}
        >
          <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {scoredMatches.map((m) => (
              <ActionForm
                key={m.id}
                action={attachVideo.bind(null, event.id)}
                className="flex flex-col gap-1.5 rounded-xl bg-mint-net/10 p-3 text-sm"
              >
                <input type="hidden" name="matchId" value={m.id} />
                <div className="flex items-center gap-1.5">
                  {m.videoUrl ? <span aria-hidden className="text-mint-lime-ink">✓</span> : null}
                  <span className="truncate text-mint-ink-muted">{m.label}</span>
                </div>
                <span className="truncate font-semibold text-mint-ink">
                  {m.teamAId ? teamNameById[m.teamAId] ?? "?" : "?"} vs {m.teamBId ? teamNameById[m.teamBId] ?? "?" : "?"}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    name="videoUrl"
                    defaultValue={m.videoUrl ?? ""}
                    placeholder="https://youtube.com/…"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-mint-net/25 bg-white px-2 text-mint-ink placeholder:text-mint-ink-muted/60"
                  />
                  <SaveButton variant="ghost" size="sm" />
                </div>
              </ActionForm>
            ))}
          </div>
        </Section>
      ) : null}

      {event.status === "finished" ? (
        <Section title="Eindstand" subtitle="Herbereken de eindstand op basis van de huidige wedstrijduitslagen">
          <p className="text-xs text-mint-ink-muted">
            Nodig als het event werd afgerond terwijl de halve finales of finales nog niet (volledig) gescoord waren
            — de publieke eindstand liet dan &quot;?&quot; zien op die plekken. Werkt de eindstand bij zonder de
            afgeronde status te wijzigen.
          </p>
          <ConfirmButton
            label="Herbereken eindstand"
            confirmText="Eindstand opnieuw berekenen op basis van de huidige scores?"
            action={recomputePlacements.bind(null, event.id)}
            variant="secondary"
            successMessage="Eindstand herberekend."
          />
        </Section>
      ) : null}
    </>
  );
}

function confirmTextFor(status: string, teamCount: number) {
  if (status === "draft") return `Poulefase starten met ${teamCount} teams?`;
  if (status === "pauze_1") return "Kwartfinales starten met de gepubliceerde top 8?";
  if (status === "prijsuitreiking") return "Eindstand vastzetten en de resultatenpagina publiceren?";
  return "Doorgaan naar de volgende fase?";
}
