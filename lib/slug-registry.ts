import { repo } from "@/lib/data";
import { sessionsRepo } from "@/lib/data/sessions";

/**
 * Tournament events and sessions both live at the flat /{slug} namespace, so a
 * slug must be unique across BOTH tables — each table's own `unique` constraint
 * only protects it against itself. Pass `exclude` when renaming an existing
 * event/session so it doesn't collide with its own current slug.
 */
export async function isSlugTaken(slug: string, exclude?: { kind: "event" | "session"; id: string }): Promise<boolean> {
  const [event, session] = await Promise.all([repo.getEventBySlug(slug), sessionsRepo.getSessionBySlug(slug)]);
  if (event && !(exclude?.kind === "event" && event.id === exclude.id)) return true;
  if (session && !(exclude?.kind === "session" && session.id === exclude.id)) return true;
  return false;
}
