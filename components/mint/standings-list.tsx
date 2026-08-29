"use client";

import { useEffect, useRef, useState } from "react";

export interface StandingsRow {
  teamId: string;
  name: string;
  points: number;
  saldo: number;
  pouleLabel?: string;
  resting?: boolean;
}

const ROW_HEIGHT = 44;

/** Design 6A trial variant of components/standings-list.tsx — identical animation logic, restyled for the light "mint" palette. */
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
    <div className="rounded-[28px] border border-mint-net/25 bg-mint-surface p-1">
      {rows.map((row, i) => {
        const offset = offsets.get(row.teamId) ?? 0;
        const flashed = flashIds.has(row.teamId);
        return (
          <div
            key={row.teamId}
            className="flex h-11 items-center gap-2 rounded-2xl px-3 text-mint-ink transition-[transform,background-color] duration-500 ease-[cubic-bezier(.2,.9,.2,1)]"
            style={{
              transform: offset ? `translateY(${offset}px)` : undefined,
              backgroundColor: flashed ? "rgba(210,233,92,.35)" : "transparent",
            }}
          >
            <span
              className={`w-6 font-mint text-xl font-bold tabular-nums ${
                i === 0 ? "text-mint-lime-ink" : i < 3 ? "text-mint-ink" : "text-mint-ink-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className="w-2.5 text-xs font-bold text-mint-lime-ink">{flashed ? "▲" : ""}</span>
            {row.pouleLabel ? (
              <span className="rounded-full bg-mint-net/20 px-1.5 py-0.5 font-mint text-[11px] font-bold text-mint-ink">
                {row.pouleLabel}
              </span>
            ) : null}
            <span className="flex-1 truncate text-sm font-medium">{row.name}</span>
            {row.resting ? (
              <span className="rounded-full bg-mint-net/50 px-1.5 py-0.5 font-mint text-[10px] font-bold text-white">RUST</span>
            ) : null}
            <span className="w-9 text-right tabular-nums text-xs text-mint-ink-muted">
              {row.saldo > 0 ? `+${row.saldo}` : row.saldo}
            </span>
            <span
              className={`w-9 text-right font-mint text-2xl font-bold tabular-nums ${
                flashed ? "text-mint-lime-ink" : "text-mint-ink"
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
