import { redirect } from "next/navigation";
import { repo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

async function requestLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  try {
    await repo.requestMagicLink(email);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    const friendly = message.includes("rate limit")
      ? "Net al een link gestuurd — Supabase staat maar een paar e-mails per uur toe op het gratis plan. Probeer het over een uur opnieuw."
      : message;
    redirect(`/admin/login?error=${encodeURIComponent(friendly)}`);
  }
  if (await repo.currentAdminEmail()) redirect("/admin");
  redirect("/admin/login?sent=1");
}

export default function AdminLoginPage({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  return (
    <div className="min-h-screen bg-court-night">
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <Logo size="lg" />
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Admin</h1>
        <p className="mt-1 text-sm text-ink-muted">Log in met je e-mailadres — je krijgt een inloglink.</p>
      </div>
      {searchParams.sent ? (
        <div className="rounded-2xl border border-lime-serve bg-lime-serve/10 p-4 text-sm">
          Check je e-mail voor de inloglink.
        </div>
      ) : (
        <form action={requestLink} className="flex flex-col gap-3">
          {searchParams.error ? (
            <div className="rounded-2xl border border-clay-orange bg-clay-orange/10 p-4 text-sm">
              {searchParams.error}
            </div>
          ) : null}
          <input
            type="email"
            name="email"
            required
            placeholder="jij@padelsocial.nl"
            className="h-14 rounded-2xl border border-flood-white/15 bg-surface px-4 text-flood-white placeholder:text-ink-muted"
          />
          <Button type="submit" fullWidth>
            Stuur inloglink
          </Button>
        </form>
      )}
    </main>
    </div>
  );
}
