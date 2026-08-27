// Public events live at /[slug] — these top-level segments are already taken by the app itself.
const RESERVED_SLUGS = new Set(["admin", "auth"]);

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
