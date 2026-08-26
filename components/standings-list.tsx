"use client";

import { useEffect, useRef, useState } from "react";

export interface StandingsRow {
  teamId: string;
  name: string;
  points: number;
  /** Games saldo (voor - tegen) — the first tie-break below points, shown so equal-points rows explain their order. */
  saldo: number;
  pouleLabel?: string;
  resting?: boolean;
}

const ROW_HEIGHT = 44;

/**
 * The signature animated component: on reorder, rows slide to their new
 * position and a team that climbed flashes lime for ~1s. Respects
 * prefers-reduced-motion via the global CSS override in app/globals.css.
 */
export function StandingsList({ rows }: { rows: StandingsRow[] }) {
  const prevRankRef = useRef<Map<string, number> | null>(null);
  const [offsets, setOffsets] = useState<Map<string, number>>(new Map());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevRankRef.current;
    prevRankRef.current = new Map(rows.map((r, i) => [r.teamId, i]));
    if (!prev) return;

    const newOffsets = new Map<string, number>();
    const flashed = new Set<string>();
    rows.forEach((row, i) => {
      const prevIndex = prev.get(row.teamId);
      if (prevIndex !== undefined && prevIndex !== i) {
        newOffsets.set(row.teamId, (prevIndex - i) * ROW_HEIGHT);
        if (i < prevIndex) flashed.add(row.teamId);
      }
    });
    if (newOffsets.size === 0) return;

    setOffsets(newOffsets);
    setFlashIds(flashed);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOffsets(new Map())));
    const timeout = setTimeout(() => setFlashIds(new Set()), 1100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.teamId).join(",")]);

  return (
    <div className="rounded-2xl border border-flood-white/10 bg-surface p-1">
      {rows.map((row, i) => {
        const offset = offsets.get(row.teamId) ?? 0;
        const flashed = flashIds.has(row.teamId);
        return (
          <div
            key={row.teamId}
            className="flex h-11 items-center gap-2 rounded-lg px-3 transition-[transform,background-color] duration-500 ease-[cubic-bezier(.2,.9,.2,1)]"
            style={{
              transform: offset ? `translateY(${offset}px)` : undefined,
              backgroundColor: flashed ? "rgba(200,245,66,.18)" : "transparent",
            }}
          >
            <span
              className={`w-6 font-display text-xl font-bold tabular-nums ${
                i === 0 ? "text-lime-serve" : i < 3 ? "text-flood-white" : "text-ink-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className="w-2.5 text-xs font-bold text-lime-serve">{flashed ? "▲" : ""}</span>
            {row.pouleLabel ? (
              <span className="rounded bg-flood-white/10 px-1.5 py-0.5 font-display text-[11px] font-bold tracking-wider text-ink">
                {row.pouleLabel}
              </span>
            ) : null}
            <span className="flex-1 truncate text-sm font-medium">{row.name}</span>
            {row.resting ? (
              <span className="rounded bg-net-grey px-1.5 py-0.5 font-display text-[10px] font-bold tracking-wider text-court-night">
                RUST
              </span>
            ) : null}
            <span className="w-9 text-right tabular-nums text-xs text-ink-muted">
              {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
            </span>
            <span
              className={`w-9 text-right font-display text-2xl font-bold tabular-nums ${
                flashed ? "text-lime-serve" : "text-flood-white"
              }`}
            >
              {row.points}
            </span>
          </div>
        );
      })}
    </div>
  );
}
