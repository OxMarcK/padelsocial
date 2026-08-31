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

/** Design 6A trial: admin restyled for the light "mint" palette — no canvas reference for these screens, extrapolates the established tokens directly onto the existing layout. */
export default function AdminLoginPage({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
        <Logo variant="light" size="lg" />
        <div>
          <h1 className="font-mint text-3xl font-bold text-mint-ink">Admin</h1>
          <p className="mt-1 text-sm text-mint-ink-muted">Log in met je e-mailadres — je krijgt een inloglink.</p>
        </div>
        {searchParams.sent ? (
          <div className="rounded-2xl border border-mint-lime bg-mint-lime/15 p-4 text-sm text-mint-lime-ink">
            Check je e-mail voor de inloglink.
          </div>
        ) : (
          <form action={requestLink} className="flex flex-col gap-3">
            {searchParams.error ? (
              <div className="rounded-2xl border border-clay-orange bg-clay-orange/10 p-4 text-sm text-mint-ink">
                {searchParams.error}
              </div>
            ) : null}
            <input
              type="email"
              name="email"
              required
              placeholder="jij@padelsocial.nl"
              className="h-14 rounded-2xl border border-mint-net/25 bg-white px-4 text-mint-ink placeholder:text-mint-ink-muted/60"
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
