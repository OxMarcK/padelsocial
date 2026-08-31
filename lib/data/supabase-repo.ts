import "server-only";
import { generatePouleSchedule } from "../poule-scheduler";
import { resolveBracketMatches, resolveTop8, computeTop8Ranking, type MatchResult } from "../bracket-engine";
import { computeStandings } from "../standings";
import { nextStatus, prevStatus } from "../phases";
import type { Match, PadelEvent, Placement, Poule, PouleLabel, Team } from "../types";
import type { CreateEventInput, DataRepo, NewTeamInput, Top8State } from "./repo";
import { supabaseAdmin } from "./supabase/admin";
import { supabaseServerClient } from "./supabase/server";

/**
 * Supabase/Postgrest errors are plain objects, not Error instances — thrown
 * as-is they serialize across the Server Action boundary as "[object
 * Object]" with no message. Always raise through this instead of `throw`.
 */
function raise(error: unknown): never {
  const message =
    error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : String(error);
  throw new Error(message);
}

function mapEvent(row: any): PadelEvent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    date: row.date,
    startTime: row.start_time,
    location: row.location,
    courts: row.courts,
    description: row.description,
    coverUrl: row.cover_url,
    status: row.status,
    points: { win: row.points_win, draw: row.points_draw, loss: row.points_loss },
    schedule: {
      pouleChangeoverMinutes: row.poule_changeover_minutes,
      pauzeAfterPoulefaseMinutes: row.pauze_after_poulefase_minutes,
      pauzeAfterKwartfinaleMinutes: row.pauze_after_kwartfinale_minutes,
      pauzeAfterHalveFinaleMinutes: row.pauze_after_halve_finale_minutes,
    },
    currentPouleRound: row.current_poule_round,
    createdAt: row.created_at,
  };
}

function mapTeam(row: any): Team {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    player1: { id: row.player1_id, name: row.player1_name ?? "" },
    player2: { id: row.player2_id, name: row.player2_name ?? "" },
    contactEmail: row.contact_email ?? null,
    contactPhone: row.contact_phone ?? null,
  };
}

async function fetchEvent(client: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<PadelEvent> {
  const { data, error } = await client.from("events").select("*").eq("id", eventId).single();
  if (error || !data) throw new Error(`Event not found: ${eventId}`);
  return mapEvent(data);
}

async function fetchTeamsWithNames(client: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<Team[]> {
  // Explicit FK-qualified embeds (not the public_team_players view) — PostgREST
  // can't auto-embed a view with two paths back to the same table (player1_id
  // and player2_id both point at players.id), so it always needs telling which
  // constraint to follow. Safe here: this repo only ever runs server-side with
  // the service-role client, and we still only ever read `.name` off these.
  const { data, error } = await client
    .from("teams")
    .select("*, player1:players!teams_player1_id_fkey(name), player2:players!teams_player2_id_fkey(name)")
    .eq("event_id", eventId);
  if (error) raise(error);
  return (data ?? []).map((row: any) =>
    mapTeam({ ...row, player1_name: row.player1?.name, player2_name: row.player2?.name })
  );
}

async function fetchPoules(client: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<Poule[]> {
  const { data: poules, error } = await client.from("poules").select("*").eq("event_id", eventId).order("label");
  if (error) raise(error);
  const result: Poule[] = [];
  for (const p of poules ?? []) {
    const { data: pt, error: ptError } = await client.from("poule_teams").select("team_id").eq("poule_id", p.id);
    if (ptError) raise(ptError);
    result.push({ id: p.id, eventId, label: p.label, teamIds: (pt ?? []).map((r: any) => r.team_id) });
  }
  return result;
}

async function fetchPouleMatches(client: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<Match[]> {
  const { data, error } = await client.from("matches").select("*").eq("event_id", eventId);
  if (error) raise(error);
  return (data ?? []).map(
    (row: any): Match => ({
      id: row.id,
      eventId,
      phase: "poule",
      roundNumber: row.round_number,
      courtNumber: row.court_number,
      label: row.label,
      teamAId: row.team_a_id,
      teamBId: row.team_b_id,
      scoreA: row.score_a,
      scoreB: row.score_b,
      videoUrl: row.video_url,
      pouleId: row.poule_id,
    })
  );
}

async function fetchBracketResults(client: ReturnType<typeof supabaseAdmin>, eventId: string) {
  const { data, error } = await client.from("bracket_results").select("*").eq("event_id", eventId);
  if (error) raise(error);
  const results: Partial<Record<string, MatchResult>> = {};
  for (const row of data ?? []) results[row.match_def_id] = { scoreA: row.score_a, scoreB: row.score_b };
  return results;
}

async function fetchTop8(client: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<Top8State | null> {
  const { data, error } = await client.from("bracket_state").select("*").eq("event_id", eventId).maybeSingle();
  if (error) raise(error);
  if (!data) return null;
  return { top8: data.top8, placementSeeds: data.placement_seeds };
}

async function fetchVideoUrls(client: ReturnType<typeof supabaseAdmin>, matchIds: string[]) {
  if (matchIds.length === 0) return new Map<string, string | null>();
  const { data, error } = await client.from("match_video").select("*").in("match_id", matchIds);
  if (error) raise(error);
  return new Map((data ?? []).map((r: any) => [r.match_id, r.video_url as string | null]));
}

async function synthesizeBracketMatches(client: ReturnType<typeof supabaseAdmin>, eventId: string): Promise<Match[]> {
  const top8 = await fetchTop8(client, eventId);
  if (!top8) return [];

  const bracketResults = await fetchBracketResults(client, eventId);
  const resolvedBracket = resolveBracketMatches(top8.top8, bracketResults);
  const bracketMatches = resolvedBracket.map((m) => ({
    id: `${eventId}:bracket:${m.id}`,
    eventId,
    phase: m.phase,
    roundNumber: m.round,
    courtNumber: m.court,
    label: m.label,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    videoUrl: null as string | null,
    bracketMatchId: m.id,
  }));

  const videoUrls = await fetchVideoUrls(client, bracketMatches.map((m) => m.id));
  return bracketMatches.map((m) => ({ ...m, videoUrl: videoUrls.get(m.id) ?? null }));
}

function parseSyntheticId(matchId: string): { eventId: string; kind: "bracket"; defId: string } | null {
  const parts = matchId.split(":");
  if (parts.length !== 3) return null;
  const [eventId, kind, defId] = parts;
  if (kind !== "bracket") return null;
  return { eventId: eventId!, kind, defId: defId! };
}

export const supabaseRepo: DataRepo = {
  async listEvents() {
    const client = supabaseAdmin();
    const { data, error } = await client.from("events").select("*").order("created_at", { ascending: false });
    if (error) raise(error);
    return (data ?? []).map(mapEvent);
  },

  async getEvent(id) {
    const client = supabaseAdmin();
    const { data, error } = await client.from("events").select("*").eq("id", id).maybeSingle();
    if (error) raise(error);
    return data ? mapEvent(data) : null;
  },

  async getEventBySlug(slug) {
    const client = supabaseAdmin();
    const { data, error } = await client.from("events").select("*").eq("slug", slug).maybeSingle();
    if (error) raise(error);
    return data ? mapEvent(data) : null;
  },

  async createEvent(input: CreateEventInput) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("events")
      .insert({
        slug: input.slug,
        name: input.name,
        date: input.date,
        start_time: input.startTime,
        location: input.location,
        courts: input.courts,
        description: input.description,
        cover_url: input.coverUrl,
      })
      .select()
      .single();
    if (error) raise(error);
    return mapEvent(data);
  },

  async updateEvent(id, patch) {
    const client = supabaseAdmin();
    const update: Record<string, unknown> = {};
    if (patch.slug !== undefined) update.slug = patch.slug;
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.date !== undefined) update.date = patch.date;
    if (patch.startTime !== undefined) update.start_time = patch.startTime;
    if (patch.location !== undefined) update.location = patch.location;
    if (patch.courts !== undefined) update.courts = patch.courts;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.coverUrl !== undefined) update.cover_url = patch.coverUrl;
    if (patch.pointsWin !== undefined) update.points_win = patch.pointsWin;
    if (patch.pointsDraw !== undefined) update.points_draw = patch.pointsDraw;
    if (patch.pointsLoss !== undefined) update.points_loss = patch.pointsLoss;
    if (patch.pouleChangeoverMinutes !== undefined) update.poule_changeover_minutes = patch.pouleChangeoverMinutes;
    if (patch.pauzeAfterPoulefaseMinutes !== undefined) update.pauze_after_poulefase_minutes = patch.pauzeAfterPoulefaseMinutes;
    if (patch.pauzeAfterKwartfinaleMinutes !== undefined) update.pauze_after_kwartfinale_minutes = patch.pauzeAfterKwartfinaleMinutes;
    if (patch.pauzeAfterHalveFinaleMinutes !== undefined) update.pauze_after_halve_finale_minutes = patch.pauzeAfterHalveFinaleMinutes;
    const { data, error } = await client.from("events").update(update).eq("id", id).select().single();
    if (error) raise(error);
    return mapEvent(data);
  },

  async deleteEvent(eventId) {
    const client = supabaseAdmin();
    const { error } = await client.from("events").delete().eq("id", eventId);
    if (error) raise(error);
  },

  async advancePhase(eventId) {
    const client = supabaseAdmin();
    const event = await fetchEvent(client, eventId);
    const next = nextStatus(event.status);
    if (!next) return event;
    const { data, error } = await client.from("events").update({ status: next }).eq("id", eventId).select().single();
    if (error) raise(error);
    return mapEvent(data);
  },

  async regressPhase(eventId) {
    const client = supabaseAdmin();
    const event = await fetchEvent(client, eventId);
    const prev = prevStatus(event.status);
    if (!prev) return event;
    const { data, error } = await client.from("events").update({ status: prev }).eq("id", eventId).select().single();
    if (error) raise(error);
    return mapEvent(data);
  },

  async advancePouleRound(eventId) {
    const client = supabaseAdmin();
    const event = await fetchEvent(client, eventId);
    const poules = await fetchPoules(client, eventId);
    const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
    const next = Math.min(event.currentPouleRound + 1, schedule.roundsCount || 1);
    const { data, error } = await client.from("events").update({ current_poule_round: next }).eq("id", eventId).select().single();
    if (error) raise(error);
    return mapEvent(data);
  },

  async finishEvent(eventId) {
    const client = supabaseAdmin();
    const top8 = await fetchTop8(client, eventId);
    if (top8) {
      const bracketResults = await fetchBracketResults(client, eventId);
      const resolved = resolveBracketMatches(top8.top8, bracketResults);
      const rows: { event_id: string; team_id: string; final_rank: number }[] = [];
      for (const r of computeTop8Ranking(resolved, top8.top8)) rows.push({ event_id: eventId, team_id: r.teamId, final_rank: r.rank });

      top8.placementSeeds.forEach((teamId, i) => {
        rows.push({ event_id: eventId, team_id: teamId, final_rank: 9 + i });
      });

      if (rows.length > 0) {
        const { error } = await client.from("placements").upsert(rows, { onConflict: "event_id,team_id" });
        if (error) raise(error);
      }
    }
    const { data, error } = await client.from("events").update({ status: "finished" }).eq("id", eventId).select().single();
    if (error) raise(error);
    return mapEvent(data);
  },

  async recomputePlacements(eventId) {
    const client = supabaseAdmin();
    const top8 = await fetchTop8(client, eventId);
    const rows: { event_id: string; team_id: string; final_rank: number }[] = [];
    if (top8) {
      const bracketResults = await fetchBracketResults(client, eventId);
      const resolved = resolveBracketMatches(top8.top8, bracketResults);
      for (const r of computeTop8Ranking(resolved, top8.top8)) rows.push({ event_id: eventId, team_id: r.teamId, final_rank: r.rank });

      top8.placementSeeds.forEach((teamId, i) => {
        rows.push({ event_id: eventId, team_id: teamId, final_rank: 9 + i });
      });
    }
    // Delete-then-insert (not upsert) — a stale row from a previous
    // finish/recompute for a team that no longer ranks (e.g. the top8 was
    // republished with different seeds) must not survive the recompute.
    const { error: deleteError } = await client.from("placements").delete().eq("event_id", eventId);
    if (deleteError) raise(deleteError);
    if (rows.length > 0) {
      const { error } = await client.from("placements").insert(rows);
      if (error) raise(error);
    }
    const { data, error: listError } = await client.from("placements").select("*").eq("event_id", eventId);
    if (listError) raise(listError);
    return (data ?? []).map(
      (row: any): Placement => ({ id: row.id, eventId, teamId: row.team_id, finalRank: row.final_rank })
    );
  },

  async listTeams(eventId) {
    const client = supabaseAdmin();
    return fetchTeamsWithNames(client, eventId);
  },

  async bulkAddTeams(eventId, teams: NewTeamInput[]) {
    const client = supabaseAdmin();
    const created: Team[] = [];
    for (const input of teams) {
      const { data: p1, error: p1Error } = await client.from("players").insert({ name: input.player1Name }).select().single();
      if (p1Error) raise(p1Error);
      const { data: p2, error: p2Error } = await client.from("players").insert({ name: input.player2Name }).select().single();
      if (p2Error) raise(p2Error);
      const { data: team, error: teamError } = await client
        .from("teams")
        .insert({
          event_id: eventId,
          name: input.name,
          player1_id: p1.id,
          player2_id: p2.id,
        })
        .select()
        .single();
      if (teamError) raise(teamError);
      created.push(mapTeam({ ...team, player1_name: p1.name, player2_name: p2.name }));
    }
    return created;
  },

  async updateTeam(eventId, teamId, name) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("teams")
      .update({ name })
      .eq("id", teamId)
      .eq("event_id", eventId)
      .select("*, player1:players!teams_player1_id_fkey(name), player2:players!teams_player2_id_fkey(name)")
      .single();
    if (error) raise(error);
    return mapTeam({ ...data, player1_name: data.player1?.name, player2_name: data.player2?.name });
  },

  async deleteTeam(eventId, teamId) {
    const client = supabaseAdmin();
    const { data: team, error: fetchError } = await client
      .from("teams")
      .select("player1_id, player2_id")
      .eq("id", teamId)
      .eq("event_id", eventId)
      .single();
    if (fetchError) raise(fetchError);

    // Matches reference team_a_id/team_b_id with no cascade — clear any matches
    // involving this team first, same "matches are disposable" pattern as savePoules.
    const { error: delMatchesError } = await client
      .from("matches")
      .delete()
      .eq("event_id", eventId)
      .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);
    if (delMatchesError) raise(delMatchesError);

    const { error: delTeamError } = await client.from("teams").delete().eq("id", teamId).eq("event_id", eventId);
    if (delTeamError) raise(delTeamError);

    const playerIds = [team.player1_id, team.player2_id].filter(Boolean);
    if (playerIds.length > 0) {
      const { error: delPlayersError } = await client.from("players").delete().in("id", playerIds);
      if (delPlayersError) raise(delPlayersError);
    }
  },

  async listPoules(eventId) {
    const client = supabaseAdmin();
    return fetchPoules(client, eventId);
  },

  async savePoules(eventId, assignment) {
    const client = supabaseAdmin();

    // Poule matches reference poule_id with no cascade, so a previously
    // published schedule blocks re-drawing the poules until it's cleared —
    // reassigning poules invalidates any schedule generated from the old
    // ones anyway, so treat it the same as regenerating (see publishPouleMatches).
    const { data: existingMatches, error: existingMatchesError } = await client
      .from("matches")
      .select("id")
      .eq("event_id", eventId);
    if (existingMatchesError) raise(existingMatchesError);
    if (existingMatches && existingMatches.length > 0) {
      const { error: delMatchesError } = await client.from("matches").delete().in(
        "id",
        existingMatches.map((m) => m.id)
      );
      if (delMatchesError) raise(delMatchesError);
    }

    const { data: existing, error: existingError } = await client.from("poules").select("id").eq("event_id", eventId);
    if (existingError) raise(existingError);
    if (existing && existing.length > 0) {
      const { error: delError } = await client.from("poules").delete().in("id", existing.map((p) => p.id));
      if (delError) raise(delError); // cascades to poule_teams
    }

    const created: Poule[] = [];
    for (const label of Object.keys(assignment) as PouleLabel[]) {
      const { data: poule, error } = await client.from("poules").insert({ event_id: eventId, label }).select().single();
      if (error) raise(error);
      const teamIds = assignment[label] ?? [];
      if (teamIds.length > 0) {
        const { error: ptError } = await client
          .from("poule_teams")
          .insert(teamIds.map((teamId) => ({ poule_id: poule.id, team_id: teamId })));
        if (ptError) raise(ptError);
      }
      created.push({ id: poule.id, eventId, label, teamIds });
    }
    return created.sort((a, b) => a.label.localeCompare(b.label));
  },

  async publishPouleMatches(eventId) {
    const client = supabaseAdmin();
    const event = await fetchEvent(client, eventId);
    const poules = await fetchPoules(client, eventId);
    if (poules.length === 0) throw new Error("Verdeel eerst de teams over de poules.");

    const { data: existing, error: existingError } = await client.from("matches").select("id").eq("event_id", eventId);
    if (existingError) raise(existingError);
    if (existing && existing.length > 0) {
      const { error: delError } = await client.from("matches").delete().in("id", existing.map((m) => m.id));
      if (delError) raise(delError);
    }

    const schedule = generatePouleSchedule(poules.map((p) => ({ label: p.label, teamIds: p.teamIds })), event.courts);
    const pouleByLabel = new Map<string, Poule>(poules.map((p) => [p.label, p]));

    const rows = schedule.matches.map((sm) => ({
      event_id: eventId,
      round_number: sm.round,
      court_number: sm.court,
      label: `Poule ${sm.pouleLabel} · Ronde ${sm.pouleRound}`,
      team_a_id: sm.teamAId,
      team_b_id: sm.teamBId,
      poule_id: pouleByLabel.get(sm.pouleLabel)!.id,
    }));
    const { data, error } = await client.from("matches").insert(rows).select();
    if (error) raise(error);
    return (data ?? []).map(
      (row: any): Match => ({
        id: row.id,
        eventId,
        phase: "poule",
        roundNumber: row.round_number,
        courtNumber: row.court_number,
        label: row.label,
        teamAId: row.team_a_id,
        teamBId: row.team_b_id,
        scoreA: row.score_a,
        scoreB: row.score_b,
        videoUrl: row.video_url,
        pouleId: row.poule_id,
      })
    );
  },

  async listMatches(eventId) {
    const client = supabaseAdmin();
    const [poule, synthetic] = await Promise.all([
      fetchPouleMatches(client, eventId),
      synthesizeBracketMatches(client, eventId),
    ]);
    return [...poule, ...synthetic].sort((a, b) => a.roundNumber - b.roundNumber || a.courtNumber - b.courtNumber);
  },

  async recordScore(eventId, matchId, scoreA, scoreB) {
    const client = supabaseAdmin();
    const synthetic = parseSyntheticId(matchId);
    if (synthetic) {
      const { error } = await client
        .from("bracket_results")
        .upsert({ event_id: synthetic.eventId, match_def_id: synthetic.defId, score_a: scoreA, score_b: scoreB }, { onConflict: "event_id,match_def_id" });
      if (error) raise(error);
      const all = await supabaseRepo.listMatches(synthetic.eventId);
      const updated = all.find((m) => m.id === matchId);
      if (!updated) throw new Error("Match not found after score update");
      return updated;
    }

    const { data, error } = await client.from("matches").update({ score_a: scoreA, score_b: scoreB }).eq("id", matchId).select().single();
    if (error) raise(error);
    return {
      id: data.id,
      eventId,
      phase: "poule",
      roundNumber: data.round_number,
      courtNumber: data.court_number,
      label: data.label,
      teamAId: data.team_a_id,
      teamBId: data.team_b_id,
      scoreA: data.score_a,
      scoreB: data.score_b,
      videoUrl: data.video_url,
      pouleId: data.poule_id,
    };
  },

  async attachVideo(eventId, matchId, videoUrl) {
    const client = supabaseAdmin();
    const synthetic = parseSyntheticId(matchId);
    if (synthetic) {
      const { error } = await client.from("match_video").upsert({ match_id: matchId, video_url: videoUrl }, { onConflict: "match_id" });
      if (error) raise(error);
      const all = await supabaseRepo.listMatches(eventId);
      const found = all.find((m) => m.id === matchId);
      if (!found) throw new Error(`Match not found: ${matchId}`);
      return found;
    }
    const { data, error } = await client.from("matches").update({ video_url: videoUrl }).eq("id", matchId).select().single();
    if (error) raise(error);
    return {
      id: data.id,
      eventId,
      phase: "poule",
      roundNumber: data.round_number,
      courtNumber: data.court_number,
      label: data.label,
      teamAId: data.team_a_id,
      teamBId: data.team_b_id,
      scoreA: data.score_a,
      scoreB: data.score_b,
      videoUrl: data.video_url,
      pouleId: data.poule_id,
    };
  },

  async previewTop8(eventId) {
    const client = supabaseAdmin();
    const event = await fetchEvent(client, eventId);
    const poules = await fetchPoules(client, eventId);
    const matches = await fetchPouleMatches(client, eventId);
    const poulesStandings = poules.map((poule) => ({
      label: poule.label,
      rows: computeStandings(
        poule.teamIds,
        matches.filter((m) => m.pouleId === poule.id).map((m) => ({ teamAId: m.teamAId!, teamBId: m.teamBId!, scoreA: m.scoreA, scoreB: m.scoreB })),
        event.points
      ),
    }));
    return resolveTop8(poulesStandings);
  },

  async publishTop8(eventId, state) {
    const client = supabaseAdmin();
    const { error } = await client
      .from("bracket_state")
      .upsert({ event_id: eventId, top8: state.top8, placement_seeds: state.placementSeeds }, { onConflict: "event_id" });
    if (error) raise(error);
  },

  async getTop8(eventId) {
    const client = supabaseAdmin();
    return fetchTop8(client, eventId);
  },

  async listPlacements(eventId) {
    const client = supabaseAdmin();
    const { data, error } = await client.from("placements").select("*").eq("event_id", eventId);
    if (error) raise(error);
    return (data ?? []).map(
      (row: any): Placement => ({ id: row.id, eventId, teamId: row.team_id, finalRank: row.final_rank })
    );
  },

  async requestMagicLink(email) {
    const client = supabaseServerClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback` },
    });
    if (error) raise(error);
  },

  async currentAdminEmail() {
    const client = supabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return user?.email ?? null;
  },

  async signOut() {
    const client = supabaseServerClient();
    await client.auth.signOut();
  },
};
