/** Padel-court visualization for the "Plekken" section on the public
 * aanmeldpagina — same visual language as components/mint/court-card.tsx
 * (blue court, white inset outline, net line), reimplemented here rather
 * than imported/shared (sessions stays isolated from the tournament side).
 * Each court shows 4 circular slot placeholders, 2 on each side of the
 * net; filled slots (based on a simple sequential fill across courts,
 * since reservations aren't assigned to a specific court/side) turn
 * tennis-ball lime, the rest stay outlined placeholders. */
export function CourtSpots({ courts, takenCount }: { courts: number; takenCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: courts }, (_, i) => {
        const filled = Math.min(4, Math.max(0, takenCount - i * 4));
        return <CourtSpotCard key={i} courtNumber={i + 1} filled={filled} />;
      })}
    </div>
  );
}

function CourtSpotCard({ courtNumber, filled }: { courtNumber: number; filled: number }) {
  const active = filled > 0;

  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${
        active ? "bg-glass-blue" : "bg-glass-blue/10"
      }`}
    >
      {/* Court outline. */}
      <div className={`absolute inset-2 rounded-xl border-2 ${active ? "border-white" : "border-glass-blue/20"}`} />
      {/* Net — full height, strongest line. */}
      <div className={`absolute inset-y-2 left-1/2 w-[2px] -translate-x-1/2 ${active ? "bg-white" : "bg-glass-blue/20"}`} />
      {/* Each of the 2 squares the net makes gets its own subtle vertical center line. */}
      <div className={`absolute inset-y-2 left-1/4 w-px -translate-x-1/2 ${active ? "bg-white/45" : "bg-glass-blue/10"}`} />
      <div className={`absolute inset-y-2 left-3/4 w-px -translate-x-1/2 ${active ? "bg-white/45" : "bg-glass-blue/10"}`} />
      {/* Only the middle pair straddling the net gets a subtle horizontal center line. */}
      <div className={`absolute left-1/4 right-1/4 top-1/2 h-px -translate-y-1/2 ${active ? "bg-white/45" : "bg-glass-blue/10"}`} />

      <div className="absolute inset-0 flex items-center justify-between px-4 pb-3">
        <div className="flex gap-1.5">
          <Dot filled={filled >= 1} active={active} />
          <Dot filled={filled >= 2} active={active} />
        </div>
        <div className="flex gap-1.5">
          <Dot filled={filled >= 3} active={active} />
          <Dot filled={filled >= 4} active={active} />
        </div>
      </div>

      <span
        className={`absolute bottom-2 left-3 font-mint text-xs font-bold uppercase tracking-wide ${
          active ? "text-white" : "text-glass-blue/40"
        }`}
      >
        Baan {courtNumber}
      </span>
    </div>
  );
}

function Dot({ filled, active }: { filled: boolean; active: boolean }) {
  if (filled) return <span className="h-3 w-3 rounded-full bg-mint-lime" />;
  return (
    <span
      className={`h-3 w-3 rounded-full border-2 ${active ? "border-white/60" : "border-glass-blue/25"}`}
    />
  );
}
