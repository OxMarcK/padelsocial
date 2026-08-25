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
        className="h-12 rounded-xl border border-flood-white/15 bg-surface px-4 text-flood-white placeholder:text-ink-muted"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {filtered.map((t) => (
          <Link
            key={t.id}
            href={`/${slug}/teams/${t.id}`}
            className="flex flex-col gap-1 rounded-xl border border-flood-white/10 bg-surface px-3 py-3 hover:bg-flood-white/5"
          >
            {t.pouleLabel ? (
              <span className="w-fit rounded bg-flood-white/10 px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-ink">
                POULE {t.pouleLabel}
              </span>
            ) : null}
            <span className="truncate text-sm font-medium">{t.name}</span>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="col-span-full text-sm text-ink-muted">Geen teams gevonden.</p> : null}
      </div>
    </div>
  );
}
