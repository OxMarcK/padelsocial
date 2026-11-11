import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { buildShareMetadata } from "@/lib/share-metadata";

/** Logo-downloads voor pers, partners en clubs. Bestanden staan in public/downloads/. */
const LOGOS = [
  {
    name: "Wit logo",
    note: "Voor donkere achtergronden en foto's.",
    file: "PS_logo_wit",
    preview: "bg-[#0E2318]",
  },
  {
    name: "Zwart logo",
    note: "Voor lichte achtergronden.",
    file: "PS_logo_zwart",
    preview: "bg-[#F5F8F5] ring-1 ring-inset ring-[rgba(14,35,24,.08)]",
  },
];

const FORMATS = [
  { ext: "svg", label: "SVG", hint: "vector" },
  { ext: "png", label: "PNG", hint: "1318 × 473" },
];

export const metadata: Metadata = buildShareMetadata("Logo's - Padel Social", "Download het Padel Social-logo als SVG of PNG.");

export default function DownloadsPage() {
  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="bg-white shadow-[0_1px_0_rgba(14,35,24,.10)]">
        <div className="mx-auto flex max-w-[1120px] items-center px-6 py-3.5">
          <a href="/" aria-label="Padel Social">
            <Logo variant="light" size="md" />
          </a>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1120px] flex-col gap-6 px-6 pb-4 pt-8 lg:pt-12">
        <div className="flex flex-col gap-3">
          <Heading as="h1" size="display">
            Logo&apos;s
          </Heading>
          <p className="max-w-[560px] text-base leading-relaxed text-mint-ink-muted">
            Download het Padel Social-logo. Gebruik SVG voor print en ontwerp, PNG voor social en presentaties. Pas het logo niet aan in vorm of kleur.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {LOGOS.map((logo) => (
            <Card key={logo.file} radius="lg" className="flex flex-col overflow-hidden">
              <div className={`flex aspect-[16/9] items-center justify-center p-10 ${logo.preview}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG preview van het downloadbestand zelf */}
                <img src={`/downloads/${logo.file}.svg`} alt={`Padel Social – ${logo.name.toLowerCase()}`} className="h-auto w-full max-w-[320px]" />
              </div>
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <Heading as="h2" size="sub" className="text-xl">
                    {logo.name}
                  </Heading>
                  <p className="text-sm font-medium text-mint-ink-muted">{logo.note}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {FORMATS.map((format) => (
                    <a
                      key={format.ext}
                      href={`/downloads/${logo.file}.${format.ext}`}
                      download={`${logo.file}.${format.ext}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-mint-ink px-5 text-[15px] font-bold text-white transition hover:brightness-125"
                    >
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
                      </svg>
                      {format.label}
                      <span className="text-[13px] font-semibold text-white/60">{format.hint}</span>
                    </a>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-sm font-medium text-mint-ink-muted">
          Iets anders nodig?{" "}
          <a href="mailto:info@padelsocial.nl" className="font-semibold text-mint-lime-ink hover:text-mint-ink">
            info@padelsocial.nl
          </a>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
