"use client";

/**
 * Lets a visitor "star" their own team so they can find it again faster —
 * purely a per-browser convenience (localStorage), no account/backend
 * involved. Scoped per event slug since a team id could in theory repeat
 * across events and a person only ever cares about "my team" for the event
 * they're currently looking at.
 */
function storageKey(slug: string): string {
  return `padelsocial:favorite-team:${slug}`;
}

export function getFavoriteTeamId(slug: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(slug));
  } catch {
    // private-browsing / blocked storage — favoriting just won't persist
    return null;
  }
}

export function setFavoriteTeamId(slug: string, teamId: string | null): void {
  try {
    if (teamId) window.localStorage.setItem(storageKey(slug), teamId);
    else window.localStorage.removeItem(storageKey(slug));
  } catch {
    // see above
  }
}
