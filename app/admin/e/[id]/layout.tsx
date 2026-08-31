import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { repo } from "@/lib/data";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Shared chrome for the three event-admin routes (Scores, Teams & poules, Instellingen)
 * — title/date header + page nav. Each page used to be one giant accordion-stuffed
 * document; splitting into real routes means the stepper/phase card (which only Scores
 * needs) doesn't have to compete for space with setup forms nobody's touching mid-event.
 */
export default async function AdminEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  await requireAdmin();
  const event = await repo.getEvent(params.id);
  if (!event) notFound();

  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <div>
          <h1 className="font-mint text-4xl font-bold text-mint-ink">{event.name}</h1>
          <p className="text-sm text-mint-ink-muted">
            {event.date} · {event.location} · {event.courts} banen
          </p>
        </div>

        <AdminNav eventId={event.id} />

        {children}
      </main>
    </div>
  );
}
