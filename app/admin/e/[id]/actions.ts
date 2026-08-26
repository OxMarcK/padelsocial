"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import type { NewTeamInput } from "@/lib/data/repo";

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
  await repo.updateEvent(eventId, {
    name: String(formData.get("name") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    courts: Number(formData.get("courts") ?? 5),
    description: String(formData.get("description") ?? ""),
  });
  revalidatePath(path(eventId));
}

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  await repo.deleteEvent(eventId);
  redirect("/admin");
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

export async function advancePouleRound(eventId: string) {
  await requireAdmin();
  await repo.advancePouleRound(eventId);
  revalidatePath(path(eventId));
}

export async function advancePhase(eventId: string) {
  await requireAdmin();
  const event = await repo.getEvent(eventId);
  if (event?.status === "pauze_1") {
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
  if (event?.status === "prijsuitreiking") {
    await repo.finishEvent(eventId);
  } else {
    await repo.advancePhase(eventId);
  }
  revalidatePath(path(eventId));
  revalidatePath(`/e`);
}

export async function publishTop8Override(eventId: string, formData: FormData) {
  await requireAdmin();
  const seeds = Array.from({ length: 8 }, (_, i) => String(formData.get(`seed${i + 1}`) ?? "").trim());
  const placementSeeds = String(formData.get("placementSeeds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await repo.publishTop8(eventId, { top8: { seeds }, placementSeeds });
  revalidatePath(path(eventId));
}
