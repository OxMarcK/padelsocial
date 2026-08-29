import type { MatchVideoRow } from "@/lib/match-video";

const ACCENT_BORDER: Record<NonNullable<MatchVideoRow["accent"]>, string> = {
  win: "border-l-mint-lime",
  draw: "border-l-mint-net",
  loss: "border-l-clay-orange",
};
const ACCENT_SCORE: Record<NonNullable<MatchVideoRow["accent"]>, string> = {
  win: "text-mint-lime-ink",
  draw: "text-mint-ink",
  loss: "text-mint-ink",
};
const ACCENT_BADGE: Record<NonNullable<MatchVideoRow["accent"]>, { label: string; className: string }> = {
  win: { label: "W", className: "bg-mint-lime text-mint-lime-ink" },
  draw: { label: "GL", className: "bg-mint-net text-white" },
  loss: { label: "V", className: "bg-clay-orange text-white" },
};

/** Design 6A trial variant of components/match-video-list.tsx, restyled for the light "mint" palette. */
export function MatchVideoSection({ title, rows }: { title: string; rows: MatchVideoRow[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-mint text-lg font-bold text-mint-ink">{title}</h2>
        <span className="font-mint text-xs font-bold text-mint-ink-muted">{rows.length} gespeeld</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-mint-ink-muted">Nog geen video&apos;s gekoppeld.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <MatchVideoCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchVideoCard({ row }: { row: MatchVideoRow }) {
  return (
    <a
      href={row.videoUrl}
      target="_blank"
      rel="noreferrer"
      title={row.title}
      aria-label={row.title}
      className={`flex items-center gap-3 rounded-[24px] border-l-4 bg-mint-surface py-2.5 pl-3 pr-4 transition-colors hover:brightness-95 ${
        row.accent ? ACCENT_BORDER[row.accent] : "border-l-transparent"
      }`}
    >
      <div className="relative h-14 w-20 flex-none overflow-hidden rounded-xl bg-glass-blue">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25">
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
              <path d="M0 0 L11 6.5 L0 13 Z" fill="#FFFFFF" />
            </svg>
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mint text-xs font-bold text-mint-lime-ink">{row.eyebrow}</span>
        <span className="truncate text-[15px] font-semibold text-mint-ink">{row.title}</span>
        <span className="text-xs text-mint-ink-muted">{row.subtitle}</span>
      </div>
      <div className="flex flex-none flex-col items-end gap-1">
        <span className={`font-mint text-2xl font-bold tabular-nums ${row.accent ? ACCENT_SCORE[row.accent] : "text-mint-ink"}`}>
          {row.score}
        </span>
        {row.accent ? (
          <span className={`rounded-full px-1.5 py-0.5 font-mint text-[10px] font-bold ${ACCENT_BADGE[row.accent].className}`}>
            {ACCENT_BADGE[row.accent].label}
          </span>
        ) : null}
      </div>
    </a>
  );
}
