/**
 * Landing-page content that isn't tied to any one event or session —
 * currently just the Agenda hero flyer + where it links to. Its own tiny
 * repo, same reasoning as sessions.ts: keeps this decoupled from the
 * tournament/session data models rather than bolting it onto either.
 */
import "server-only";
import { supabaseAdmin } from "./supabase/admin";

export interface SiteSettings {
  heroFlyerUrl: string | null;
  heroFlyerLink: string | null;
}

export interface SiteSettingsRepo {
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(patch: Partial<SiteSettings>): Promise<SiteSettings>;
}

let mockSettings: SiteSettings = { heroFlyerUrl: null, heroFlyerLink: null };

const mockSiteSettingsRepo: SiteSettingsRepo = {
  async getSiteSettings() {
    return mockSettings;
  },
  async updateSiteSettings(patch) {
    mockSettings = { ...mockSettings, ...patch };
    return mockSettings;
  },
};

const supabaseSiteSettingsRepo: SiteSettingsRepo = {
  async getSiteSettings() {
    const client = supabaseAdmin();
    const { data, error } = await client.from("site_settings").select().eq("id", "default").single();
    if (error) throw error;
    return { heroFlyerUrl: data.hero_flyer_url, heroFlyerLink: data.hero_flyer_link };
  },
  async updateSiteSettings(patch) {
    const client = supabaseAdmin();
    const update: Record<string, unknown> = {};
    if (patch.heroFlyerUrl !== undefined) update.hero_flyer_url = patch.heroFlyerUrl;
    if (patch.heroFlyerLink !== undefined) update.hero_flyer_link = patch.heroFlyerLink;
    const { data, error } = await client
      .from("site_settings")
      .update(update)
      .eq("id", "default")
      .select()
      .single();
    if (error) throw error;
    return { heroFlyerUrl: data.hero_flyer_url, heroFlyerLink: data.hero_flyer_link };
  },
};

export const siteSettingsRepo: SiteSettingsRepo = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? supabaseSiteSettingsRepo
  : mockSiteSettingsRepo;
