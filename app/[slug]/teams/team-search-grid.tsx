"use client";

import { useState } from "react";
import Link from "next/link";

export function TeamSearchGrid({
  slug,
  teams,
}: {
  slug: string;
  teams: Array<{ id: string; name: string; pouleLabel: string | null }>;
}) {
  const [query, setQuery] = useState("");
  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een team…"
        className="h-12 rounded-full bg-white px-4 text-mint-ink shadow-[0_1px_3px_rgba(20,35,28,.08)] placeholder:text-mint-ink-muted"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/${slug}/teams/${t.id}`}
            prefetch={false}
            className="flex flex-col gap-1 rounded-2xl bg-white px-3 py-3 shadow-[0_1px_3px_rgba(20,35,28,.08)] hover:brightness-95"
          >
            {t.pouleLabel ? (
              <span className="w-fit rounded-full bg-mint-net/20 px-1.5 py-0.5 font-mint text-[10px] font-bold text-mint-ink">
                Poule {t.pouleLabel}
              </span>
            ) : null}
            <span className="truncate text-sm font-medium text-mint-ink">{t.name}</span>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="col-span-full text-sm text-mint-ink-muted">Geen teams gevonden.</p> : null}
      </div>
    </div>
  );
}
