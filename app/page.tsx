import Link from "next/link";
import { repo } from "@/lib/data";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const events = await repo.listEvents();
  const upcoming = events.find((e) => e.status !== "draft" && e.status !== "finished");
  const past = events.filter((e) => e.status === "finished");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-5 py-10">
      <Logo size="lg" />

      {upcoming ? (
        <section className="flex flex-col gap-3 rounded-2xl bg-glass-blue p-6">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-flood-white/80">
            Volgende editie
          </span>
          <h1 className="font-display text-4xl font-bold uppercase leading-tight">{upcoming.name}</h1>
          <p className="text-sm text-flood-white/85">
            {upcoming.date} · {upcoming.startTime} · {upcoming.location}
          </p>
          <Link href={`/${upcoming.slug}`}>
            <Button>Bekijk event</Button>
          </Link>
        </section>
      ) : (
        <p className="text-sm text-ink-muted">Nog geen aankomend event gepland.</p>
      )}

      {past.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Vorige events</h2>
          {past.map((e) => (
            <Link
              key={e.id}
              href={`/${e.slug}`}
              className="flex items-center justify-between rounded-2xl border border-flood-white/10 bg-surface px-4 py-3 hover:bg-flood-white/5"
            >
              <span className="font-medium">{e.name}</span>
              <span className="text-xs text-ink-muted">{e.date}</span>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
