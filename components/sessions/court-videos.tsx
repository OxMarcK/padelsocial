/**
 * Per-court video list, shown once a session is done — same card format as the
 * tournament's match-video list (components/mint/match-video-list.tsx: a court
 * thumbnail with a play icon, outbound link), reimplemented here rather than
 * imported since sessions has no match/team/score data to attach, just a
 * court number. One row per baannummer in session.courtNumbers, always —
 * courts without a video yet show a muted placeholder instead of a link.
 */
export function CourtVideos({ courtNumbers, courtVideos }: { courtNumbers: number[]; courtVideos: Record<number, string> }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <span className="font-mint text-lg font-bold text-[#0E2318]">Baan video&apos;s</span>
      <div className="mt-3 flex flex-col gap-2.5">
        {courtNumbers.map((courtNumber) => (
          <CourtVideoRow key={courtNumber} courtNumber={courtNumber} videoUrl={courtVideos[courtNumber]} />
        ))}
      </div>
    </div>
  );
}

function CourtVideoRow({ courtNumber, videoUrl }: { courtNumber: number; videoUrl?: string }) {
  const thumbnail = (
    <div className={`relative h-14 w-20 flex-none overflow-hidden rounded-xl ${videoUrl ? "bg-glass-blue" : "bg-glass-blue/15"}`}>
      <div className={`absolute inset-1.5 rounded-md border ${videoUrl ? "border-white/90" : "border-glass-blue/25"}`} />
      <div className={`absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 ${videoUrl ? "bg-white" : "bg-glass-blue/20"}`} />
      <div className={`absolute inset-y-1.5 left-1/4 w-px -translate-x-1/2 ${videoUrl ? "bg-white/45" : "bg-glass-blue/10"}`} />
      <div className={`absolute inset-y-1.5 left-3/4 w-px -translate-x-1/2 ${videoUrl ? "bg-white/45" : "bg-glass-blue/10"}`} />
      <div className={`absolute left-1/4 right-1/4 top-1/2 h-px -translate-y-1/2 ${videoUrl ? "bg-white/45" : "bg-glass-blue/10"}`} />
      {videoUrl ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25">
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
              <path d="M0 0 L11 6.5 L0 13 Z" fill="#FFFFFF" />
            </svg>
          </span>
        </div>
      ) : null}
    </div>
  );

  if (videoUrl) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noreferrer"
        title={`Baan ${courtNumber}`}
        className="flex items-center gap-3 rounded-[24px] bg-mint-net/10 py-2.5 pl-3 pr-4 transition-colors hover:brightness-95"
      >
        {thumbnail}
        <span className="text-[15px] font-semibold text-mint-ink">Baan {courtNumber}</span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[24px] py-2.5 pl-3 pr-4">
      {thumbnail}
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-mint-ink-muted">Baan {courtNumber}</span>
        <span className="text-xs text-mint-ink-muted">Nog geen video</span>
      </div>
    </div>
  );
}
