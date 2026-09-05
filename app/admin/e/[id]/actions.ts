"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import type { NewTeamInput } from "@/lib/data/repo";
import type { EventStatus } from "@/lib/types";
import { normalizeSlug, assertValidSlug } from "@/lib/slug";
import { isSlugTaken } from "@/lib/slug-registry";

function path(eventId: string) {
  return `/admin/e/${eventId}`;
}

function labelFor(index: number): string {
  return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, ...
}

export async function addTeamsBulk(eventId: string, formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("bulk") ?? "");
  const teams: NewTeamInput[] = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, p1, p2] = line.split("|").map((s) => s.trim());
      return { name: name || `${p1} & ${p2}`, player1Name: p1 ?? "", player2Name: p2 ?? "" };
    })
    .filter((t) => t.player1Name && t.player2Name);

  if (teams.length > 0) await repo.bulkAddTeams(eventId, teams);
  revalidatePath(path(eventId));
}

export async function renameTeam(eventId: string, teamId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name) await repo.updateTeam(eventId, teamId, name);
  revalidatePath(path(eventId));
}

export async function deleteTeam(eventId: string, teamId: string) {
  await requireAdmin();
  await repo.deleteTeam(eventId, teamId);
  revalidatePath(path(eventId));
}

export async function updateEventDetails(eventId: string, formData: FormData) {
  await requireAdmin();
  const event = await repo.getEvent(eventId);
  const requestedSlug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(requestedSlug);
  if (requestedSlug !== event?.slug && (await isSlugTaken(requestedSlug, { kind: "event", id: eventId }))) {
    throw new Error(`"${requestedSlug}" is al in gebruik door een ander event.`);
  }

  await repo.updateEvent(eventId, {
    slug: requestedSlug,
    name: String(formData.get("name") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    courts: Number(formData.get("courts") ?? 5),
  });
  revalidatePath(path(eventId));
  revalidatePath("/");
  if (event && event.slug !== requestedSlug) {
    revalidatePath(`/${event.slug}`);
    revalidatePath(`/${requestedSlug}`);
  }
}

/**
 * Changeover/pauze durations — advisory only, drives the displayed schedule
 * and countdown (lib/schedule.ts), never blocks or auto-advances anything.
 * Its own action/form, same reasoning as updatePoints below: a focused save
 * with its own pending/success state instead of getting lost in the big
 * Event bewerken form.
 */
export async function updateScheduleConfig(eventId: string, formData: FormData) {
  await requireAdmin();
  await repo.updateEvent(eventId, {
    pouleChangeoverMinutes: Number(formData.get("pouleChangeoverMinutes") ?? 3),
    pauzeAfterPoulefaseMinutes: Number(formData.get("pauzeAfterPoulefaseMinutes") ?? 5),
    pauzeAfterKwartfinaleMinutes: Number(formData.get("pauzeAfterKwartfinaleMinutes") ?? 3),
    pauzeAfterHalveFinaleMinutes: Number(formData.get("pauzeAfterHalveFinaleMinutes") ?? 3),
  });
  revalidatePath(path(eventId));
}

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  await repo.deleteEvent(eventId);
  redirect("/admin");
}

/**
 * finishEvent computes the final ranking exactly once, from whatever bracket
 * results exist at that moment. If an event got finished before its halve
 * finales/finales were fully scored (e.g. by racing through the phase-advance
 * "toch doorgaan" overrides), the public results page is stuck showing "?"
 * for those ranks forever — there's no other way to make it pick up a score
 * entered afterward. This recomputes and overwrites the stored ranking from
 * the event's current match results without touching its status.
 */
export async function recomputePlacements(eventId: string) {
  await requireAdmin();
  const event = await repo.getEvent(eventId);
  if (event?.status !== "finished") {
    throw new Error("Alleen mogelijk voor een afgerond event.");
  }
  await repo.recomputePlacements(eventId);
  revalidatePath(path(eventId));
  revalidatePath(`/${event.slug}`);
  revalidatePath(`/e`);
}

/**
 * Copies an event's config, teams, and poule-indeling into a brand new event —
 * for trying out a live event's exact roster/setup without touching its real
 * data. The copy starts at "draft" (no matches generated, no scores) so the
 * admin can freely click through the whole flow on it.
 */
export async function duplicateEvent(eventId: string, formData: FormData) {
  await requireAdmin();
  const source = await repo.getEvent(eventId);
  if (!source) throw new Error("Event niet gevonden.");

  const name = String(formData.get("name") ?? "").trim() || `${source.name} (test)`;
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  assertValidSlug(slug);
  if (await isSlugTaken(slug)) {
    throw new Error(`"${slug}" is al in gebruik door een ander event.`);
  }

  const copy = await repo.createEvent({
    name,
    slug,
    date: source.date,
    startTime: source.startTime,
    location: source.location,
    courts: source.courts,
    coverUrl: null,
  });
  await repo.updateEvent(copy.id, {
    pointsWin: source.points.win,
    pointsDraw: source.points.draw,
    pointsLoss: source.points.loss,
    pouleChangeoverMinutes: source.schedule.pouleChangeoverMinutes,
    pauzeAfterPoulefaseMinutes: source.schedule.pauzeAfterPoulefaseMinutes,
    pauzeAfterKwartfinaleMinutes: source.schedule.pauzeAfterKwartfinaleMinutes,
    pauzeAfterHalveFinaleMinutes: source.schedule.pauzeAfterHalveFinaleMinutes,
  });

  const teams = await repo.listTeams(eventId);
  if (teams.length > 0) {
    const newTeams = await repo.bulkAddTeams(
      copy.id,
      teams.map((t) => ({
        name: t.name,
        player1Name: t.player1.name,
        player2Name: t.player2.name,
        contactEmail: t.contactEmail,
        contactPhone: t.contactPhone,
      }))
    );
    const newIdByIndex = newTeams.map((t) => t.id);
    const oldIdToNewId = new Map(teams.map((t, i) => [t.id, newIdByIndex[i]]));

    const poules = await repo.listPoules(eventId);
    if (poules.length > 0) {
      const assignment: Record<string, string[]> = {};
      for (const p of poules) {
        assignment[p.label] = p.teamIds.map((id) => oldIdToNewId.get(id)).filter((id): id is string => Boolean(id));
      }
      await repo.savePoules(copy.id, assignment);
    }
  }

  revalidatePath("/");
  redirect(`/admin/e/${copy.id}`);
}

export async function randomizePoules(eventId: string, formData: FormData) {
  await requireAdmin();
  const teams = await repo.listTeams(eventId);
  const requested = Number(formData.get("pouleCount"));
  const pouleCount = Math.max(1, Math.round(requested > 0 ? requested : teams.length / 5) || 1);
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const assignment: Record<string, string[]> = {};
  for (let i = 0; i < pouleCount; i++) assignment[labelFor(i)] = [];
  shuffled.forEach((team, i) => {
    assignment[labelFor(i % pouleCount)]!.push(team.id);
  });
  await repo.savePoules(eventId, assignment);
  revalidatePath(path(eventId));
}

export async function savePoulesManual(eventId: string, formData: FormData) {
  await requireAdmin();
  const teams = await repo.listTeams(eventId);
  const assignment: Record<string, string[]> = {};
  for (const team of teams) {
    const value = String(formData.get(`poule_${team.id}`) ?? "");
    if (/^[A-Z]$/.test(value)) {
      assignment[value] = assignment[value] ?? [];
      assignment[value]!.push(team.id);
    }
  }
  await repo.savePoules(eventId, assignment);
  revalidatePath(path(eventId));
}

export async function publishPouleMatches(eventId: string) {
  await requireAdmin();
  await repo.publishPouleMatches(eventId);
  revalidatePath(path(eventId));
}

export async function updatePoints(eventId: string, formData: FormData) {
  await requireAdmin();
  await repo.updateEvent(eventId, {
    pointsWin: Number(formData.get("win") ?? 3),
    pointsDraw: Number(formData.get("draw") ?? 1),
    pointsLoss: Number(formData.get("loss") ?? 0),
  });
  revalidatePath(path(eventId));
}

export async function recordScore(eventId: string, matchId: string, scoreA: number, scoreB: number) {
  await requireAdmin();
  await repo.recordScore(eventId, matchId, scoreA, scoreB);
  revalidatePath(path(eventId));
  revalidatePath(`/e`);
}

export async function attachVideo(eventId: string, formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  await repo.attachVideo(eventId, matchId, videoUrl || null);
  revalidatePath(path(eventId));
}

/**
 * `expectedRound` is the round the button was showing when clicked — captured
 * client-side at that moment. If the round has already moved on by the time
 * this runs (a duplicate submission: a slow revalidation left the old button
 * clickable and it got pressed twice, a retried request, browser back/forward
 * cache, ...) this is a no-op instead of skipping a second round. See
 * advancePhase below for the same guard on phase transitions, which is the
 * more damaging version of this — skipping a whole bracket round.
 */
export async function advancePouleRound(eventId: string, expectedRound: number) {
  await requireAdmin();
  const event = await repo.getEvent(eventId);
  if (event?.currentPouleRound !== expectedRound) {
    revalidatePath(path(eventId));
    return;
  }
  await repo.advancePouleRound(eventId);
  revalidatePath(path(eventId));
}

/**
 * `expectedStatus` guards against advancing twice off one click: it's the
 * status the button was showing when clicked, captured client-side at that
 * moment. If the event has already moved past it by the time this runs, do
 * nothing instead of advancing again — otherwise a slow page revalidation
 * (real network/DB latency) can leave the old "Start kwartfinales"-style
 * button clickable for a moment after it already fired, and a second click
 * silently skips an entire bracket round with no matches ever generated for
 * it (reported live: two clicks on "Start kwartfinales" landed the event on
 * pauze_2 with the kwartfinales never played).
 */
export async function advancePhase(eventId: string, expectedStatus: EventStatus) {
  await requireAdmin();
  const event = await repo.getEvent(eventId);
  if (event?.status !== expectedStatus) {
    revalidatePath(path(eventId));
    return;
  }
  if (event.status === "pauze_1") {
    const top8 = await repo.getTop8(eventId);
    if (!top8) {
      const preview = await repo.previewTop8(eventId);
      await repo.publishTop8(eventId, preview);
    }
  }
  // Leaving prijsuitreiking must go through finishEvent — it computes and
  // stores the final placements. A plain repo.advancePhase() here would just
  // flip the status to "finished" with nobody ever ranked (see page.tsx: the
  // generic top-of-page advance button uses this action for every transition,
  // including this last one, so it has to do the right thing on its own).
  if (event.status === "prijsuitreiking") {
    await repo.finishEvent(eventId);
  } else {
    await repo.advancePhase(eventId);
  }
  revalidatePath(path(eventId));
  revalidatePath(`/e`);
}

/**
 * The other direction: step back one phase to fix something — a wrong top-8
 * seed after kwartfinales already started, a score that needs correcting
 * before the round it belongs to is reachable again, or a phase advanced by
 * mistake. Same expectedStatus staleness guard as advancePhase. Nothing but
 * status changes here (see DataRepo.regressPhase) — published top8, match
 * scores and placements all stay put, so stepping back just re-opens the
 * editing UI for that phase; stepping forward again re-derives everything
 * downstream the normal way.
 */
export async function regressPhase(eventId: string, expectedStatus: EventStatus) {
  await requireAdmin();
  const event = await repo.getEvent(eventId);
  if (event?.status !== expectedStatus) {
    revalidatePath(path(eventId));
    return;
  }
  await repo.regressPhase(eventId);
  revalidatePath(path(eventId));
  revalidatePath(`/e`);
}

export async function publishTop8Override(eventId: string, formData: FormData) {
  await requireAdmin();
  const seeds = Array.from({ length: 8 }, (_, i) => String(formData.get(`seed${i + 1}`) ?? "").trim());
  // One <select> per placement (plek 9, 10, ...) instead of a single free-typed, comma-joined
  // id list — same failure mode as the seed pickers below: a hand-typed team id is easy to
  // fat-finger and gives no feedback until publish. Field count is however many the form sent.
  const placementSeeds: string[] = [];
  for (let i = 9; formData.has(`placement${i}`); i++) {
    const value = String(formData.get(`placement${i}`) ?? "").trim();
    if (value) placementSeeds.push(value);
  }
  await repo.publishTop8(eventId, { top8: { seeds }, placementSeeds });
  revalidatePath(path(eventId));
}
