import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Body's own text color stays light (text-flood-white) for admin's sake —
 * see app/layout.tsx — so this needs its own explicit dark-on-mint styling
 * rather than inheriting the default.
 */
export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <Logo variant="light" size="lg" />
      <div>
        <div className="text-2xl font-bold">Pagina niet gevonden</div>
        <p className="mt-1 text-sm text-mint-ink-muted">Deze link bestaat niet (meer).</p>
      </div>
      <Link href="/" className="font-mint text-sm font-bold text-mint-lime-ink underline underline-offset-2">
        Terug naar Padel Social
      </Link>
    </div>
  );
}
