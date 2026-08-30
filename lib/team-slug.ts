/**
 * Friendly team-detail URLs (/[slug]/teams/afro-bros instead of an opaque
 * id) — mainly so a shared team card's link reads as something, not noise.
 * Slugs are derived from the team name and only unique *within one event*
 * (disambiguated by a -2/-3/... suffix for duplicate names, in team order),
 * so always build the map from the full team list, not one team at a time.
 */
export function slugifyTeamName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "team";
}

/** teamId -> unique friendly slug for this event's team list. */
export function buildTeamSlugMap(teams: Array<{ id: string; name: string }>): Map<string, string> {
  const counts = new Map<string, number>();
  const map = new Map<string, string>();
  for (const t of teams) {
    const base = slugifyTeamName(t.name);
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    map.set(t.id, n === 1 ? base : `${base}-${n}`);
  }
  return map;
}

/**
 * Resolves a URL segment back to a team — accepts either a friendly slug
 * (the normal case) or a raw team id (so any already-shared/bookmarked link
 * from before this change keeps working).
 */
export function resolveTeamBySlugOrId<T extends { id: string; name: string }>(teams: T[], slugOrId: string): T | undefined {
  const bySlug = buildTeamSlugMap(teams);
  return teams.find((t) => t.id === slugOrId || bySlug.get(t.id) === slugOrId);
}
