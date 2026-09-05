// Public events AND sessions both live at /[slug] — these top-level segments are
// already taken by the app itself. Sessions used to live at their own /sessies/[slug]
// route; that path now just redirects into the flat /[slug] namespace (kept
// permanently, since /sessies/* links are already shared via WhatsApp and can't be
// recalled), so "sessies" stays reserved forever — otherwise an event or session
// could someday claim that literal slug and collide with the redirect route.
const RESERVED_SLUGS = new Set(["admin", "auth", "sessies"]);

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}

/** Throws with a Dutch, user-facing message — safe to let a Server Action surface directly. */
export function assertValidSlug(slug: string): void {
  if (!slug) throw new Error("Slug mag niet leeg zijn.");
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`"${slug}" is een gereserveerd pad en kan niet als slug gebruikt worden.`);
  }
}
