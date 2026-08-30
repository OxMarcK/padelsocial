"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavoriteTeamId, setFavoriteTeamId } from "@/lib/client/favorite-team";
import { StarIcon } from "@/components/mint/star-icon";

export interface TeamListRow {
  id: string;
  name: string;
  pouleLabel: string | null;
  player1Name: string;
  player2Name: string;
  finalRank: number | null;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Design 6A trial: Teams list restyled to match the Claude Design canvas's ranked-list format. */
export function TeamSearchGrid({ slug, teams }: { slug: string; teams: TeamListRow[] }) {
  const [query, setQuery] = useState("");
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteId(getFavoriteTeamId(slug));
  }, [slug]);

  function toggleFavorite(e: React.MouseEvent, teamId: string) {
    e.preventDefault();
    e.stopPropagation();
    const next = favoriteId === teamId ? null : teamId;
    setFavoriteId(next);
    setFavoriteTeamId(slug, next);
  }

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  // The starred team ("onthoud dit team") rises to the top, so it's the first thing visible on return visits.
  const sorted = [...filtered].sort((a, b) => (a.id === favoriteId ? -1 : b.id === favoriteId ? 1 : 0));

  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een team…"
        className="h-12 rounded-full bg-white px-4 text-mint-ink shadow-[0_1px_3px_rgba(20,35,28,.08)] placeholder:text-mint-ink-muted"
      />
      <div className="flex flex-col gap-2.5">
        {sorted.map((t) => (
          <Link
            key={t.id}
            href={`/${slug}/teams/${t.id}`}
            prefetch={false}
            className="flex items-center gap-3.5 rounded-[24px] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-95"
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-mint-lime/40 font-mint text-lg font-bold text-mint-lime-ink">
              {t.pouleLabel ?? "?"}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="truncate font-mint text-lg font-bold text-mint-ink">{t.name}</span>
                {t.finalRank !== null && t.finalRank <= 3 ? (
                  <span className="flex-none rounded-full bg-mint-lime px-2.5 py-0.5 font-mint text-xs font-bold text-mint-lime-ink">
                    Top 3
                  </span>
                ) : t.finalRank !== null && t.finalRank <= 8 ? (
                  <span className="flex-none rounded-full bg-mint-lime/40 px-2.5 py-0.5 font-mint text-xs font-bold text-mint-lime-ink">
                    Top 8
                  </span>
                ) : null}
              </span>
              <span className="truncate text-sm text-mint-ink-muted">
                {firstName(t.player1Name)} & {firstName(t.player2Name)}
              </span>
            </span>
            <button
              onClick={(e) => toggleFavorite(e, t.id)}
              aria-pressed={favoriteId === t.id}
              aria-label={favoriteId === t.id ? "Team onthouden — tik om te vergeten" : "Onthoud dit team"}
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                favoriteId === t.id ? "text-mint-lime-ink" : "text-mint-net/60 hover:text-mint-ink-muted"
              }`}
            >
              <StarIcon filled={favoriteId === t.id} className="h-5 w-5" />
            </button>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="text-sm text-mint-ink-muted">Geen teams gevonden.</p> : null}
      </div>
    </div>
  );
}
