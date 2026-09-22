"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { siteSettingsRepo } from "@/lib/data/site-settings";
import { agendaLinksRepo } from "@/lib/data/agenda-links";
import { supabaseAdmin } from "@/lib/data/supabase/admin";

export async function uploadHeroFlyer(formData: FormData) {
  await requireAdmin();
  const file = formData.get("flyer");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Kies een afbeelding om te uploaden.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Flyer-upload werkt alleen met een gekoppeld Supabase-project.");
  }

  const client = supabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectPath = `hero-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await client.storage
    .from("flyers")
    .upload(objectPath, bytes, { contentType: file.type || "image/jpeg", upsert: true });
  if (uploadError) throw new Error(`Upload mislukt: ${uploadError.message}`);

  const { data } = client.storage.from("flyers").getPublicUrl(objectPath);
  await siteSettingsRepo.updateSiteSettings({ heroFlyerUrl: data.publicUrl });
  revalidatePath("/admin/agenda");
  revalidatePath("/");
}

export async function updateHeroFlyerLink(formData: FormData) {
  await requireAdmin();
  const link = String(formData.get("link") ?? "").trim();
  await siteSettingsRepo.updateSiteSettings({ heroFlyerLink: link || null });
  revalidatePath("/admin/agenda");
  revalidatePath("/");
}

export async function clearHeroFlyer() {
  await requireAdmin();
  await siteSettingsRepo.updateSiteSettings({ heroFlyerUrl: null, heroFlyerLink: null });
  revalidatePath("/admin/agenda");
  revalidatePath("/");
}

export async function createAgendaLink(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  if (!title || !date || !startTime || !location || !link) {
    throw new Error("Vul alle velden in.");
  }
  await agendaLinksRepo.createAgendaLink({ title, date, startTime, location, link });
  revalidatePath("/admin/agenda");
  revalidatePath("/");
}

export async function deleteAgendaLink(id: string) {
  await requireAdmin();
  await agendaLinksRepo.deleteAgendaLink(id);
  revalidatePath("/admin/agenda");
  revalidatePath("/");
}
