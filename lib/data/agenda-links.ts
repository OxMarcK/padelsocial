/**
 * Lightweight, manually-added agenda entries that link out to an external
 * page instead of an internal /{slug} — for the exceptional case of
 * promoting something on the Agenda page that isn't a real tournament
 * Event or Session (which each carry their own heavyweight status/poule/
 * bracket or signup machinery this doesn't need). Deliberately its own tiny
 * repo, same reasoning as site-settings.ts and sessions.ts: keeps this
 * decoupled from the Event/Session data models rather than bolting an
 * "external link" escape hatch onto either of them.
 */
import "server-only";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabase/admin";

export interface AgendaLink {
  id: string;
  title: string;
  date: string;
  startTime: string;
  location: string;
  link: string;
  createdAt: string;
}

export interface NewAgendaLinkInput {
  title: string;
  date: string;
  startTime: string;
  location: string;
  link: string;
}

export interface AgendaLinksRepo {
  listAgendaLinks(): Promise<AgendaLink[]>;
  createAgendaLink(input: NewAgendaLinkInput): Promise<AgendaLink>;
  deleteAgendaLink(id: string): Promise<void>;
}

let mockLinks: AgendaLink[] = [];

const mockAgendaLinksRepo: AgendaLinksRepo = {
  async listAgendaLinks() {
    return mockLinks;
  },
  async createAgendaLink(input) {
    const link: AgendaLink = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
    mockLinks = [...mockLinks, link];
    return link;
  },
  async deleteAgendaLink(id) {
    mockLinks = mockLinks.filter((l) => l.id !== id);
  },
};

const supabaseAgendaLinksRepo: AgendaLinksRepo = {
  async listAgendaLinks() {
    const client = supabaseAdmin();
    const { data, error } = await client.from("agenda_links").select().order("date", { ascending: true });
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      startTime: row.start_time,
      location: row.location,
      link: row.link,
      createdAt: row.created_at,
    }));
  },
  async createAgendaLink(input) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from("agenda_links")
      .insert({ title: input.title, date: input.date, start_time: input.startTime, location: input.location, link: input.link })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, title: data.title, date: data.date, startTime: data.start_time, location: data.location, link: data.link, createdAt: data.created_at };
  },
  async deleteAgendaLink(id) {
    const client = supabaseAdmin();
    const { error } = await client.from("agenda_links").delete().eq("id", id);
    if (error) throw error;
  },
};

export const agendaLinksRepo: AgendaLinksRepo = process.env.NEXT_PUBLIC_SUPABASE_URL ? supabaseAgendaLinksRepo : mockAgendaLinksRepo;
