"use client";

import { useEffect, useState } from "react";
import { getFavoriteTeamId, setFavoriteTeamId } from "@/lib/client/favorite-team";
import { StarIcon } from "./star-icon";

/**
 * "Onthoud dit team" toggle for the team detail page, next to the share
 * button — a per-browser bookmark (localStorage, no account) so someone can
 * get back to their own team faster from the Teams list.
 */
export function FavoriteStarButton({ slug, teamId }: { slug: string; teamId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(getFavoriteTeamId(slug) === teamId);
  }, [slug, teamId]);

  function toggle() {
    const next = !isFavorite;
    setIsFavorite(next);
    setFavoriteTeamId(slug, next ? teamId : null);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Team onthouden — tik om te vergeten" : "Onthoud dit team"}
      className={`flex h-14 w-14 flex-none items-center justify-center rounded-full shadow-[0_1px_3px_rgba(20,35,28,.08)] transition-colors ${
        isFavorite ? "bg-mint-lime text-mint-lime-ink" : "bg-white text-mint-ink-muted"
      }`}
    >
      <StarIcon filled={isFavorite} className="h-6 w-6" />
    </button>
  );
}
