/** Shared white-card section wrapper used across the admin event pages (scores, teams & poules, settings). */
export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,35,28,.08)]">
      <div>
        <h2 className="font-mint text-xl font-bold text-mint-ink">{title}</h2>
        {subtitle ? <p className="text-xs text-mint-ink-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
