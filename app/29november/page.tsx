import type { Metadata } from "next";
import Image from "next/image";
import { buildShareMetadata } from "@/lib/share-metadata";
import { Logo } from "@/components/logo";
import { DayBadge } from "@/components/day-badge";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { WeeztixShop } from "@/components/weeztix-shop";

/** Ticketpagina voor Padel Social Toernooi #3 (29 nov 2026). Tickets lopen via
 * Weeztix, niet via onze eigen aanmelding; het live toernooi zelf krijgt op de
 * dag een gewoon event in de admin. */
const WEEZTIX_GUID = "c2c59ffe-7fd3-42a6-9d56-564f882db6e1";
const DATE = "2026-11-29";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Padelclub+Rotterdam+Korte+Stadionweg+109+Rotterdam";

const PROGRAM: { time: string; label: string; pause?: boolean }[] = [
  { time: "09:30–10:00", label: "Inchecken" },
  { time: "10:00–12:25", label: "Poulefase" },
  { time: "12:25–12:40", label: "Pauze", pause: true },
  { time: "12:40–13:00", label: "Kwartfinales" },
  { time: "13:00–13:05", label: "Pauze", pause: true },
  { time: "13:05–13:25", label: "Halve finales" },
  { time: "13:25–13:30", label: "Pauze", pause: true },
  { time: "13:30–13:50", label: "Troostfinale" },
  { time: "13:50–13:55", label: "Pauze", pause: true },
  { time: "13:55–14:15", label: "Finale" },
  { time: "14:15–14:30", label: "Prijsuitreiking" },
];

export const metadata: Metadata = buildShareMetadata(
  "Padel Social Toernooi #3 - zo 29 nov, 09:30",
  "Padelclub Rotterdam · Haal je tickets voor het derde Padel Social Toernooi.",
);

export default function Toernooi3Page() {
  return (
    <div
      className="min-h-screen font-mint text-mint-ink"
      style={{ background: "linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)" }}
    >
      <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(14,35,24,.10)]">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-6 py-3.5">
          <Logo variant="light" size="md" />
          <a
            href="#tickets"
            className="inline-flex h-11 items-center rounded-full bg-mint-ink px-5 text-[15px] font-bold text-white transition hover:brightness-125"
          >
            Tickets halen
          </a>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-12 pt-8 lg:max-w-[1120px] lg:flex-row lg:items-start lg:gap-10 lg:pt-12">
        <div className="lg:sticky lg:top-24 lg:w-[400px] lg:flex-none">
          <Image
            src="/29november/poster.jpg"
            alt="Poster Padel Social Toernooi #3: 29 november, 09:30 - 14:30, Padelclub Rotterdam"
            width={1122}
            height={1402}
            priority
            sizes="(min-width: 1024px) 400px, 100vw"
            className="h-auto w-full rounded-[20px] shadow-[0_16px_40px_rgba(14,35,24,.14)] lg:rounded-[28px]"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="self-start rounded-full bg-mint-lime px-3 py-1.5 text-[13px] font-bold">Tickets nu te koop</span>
            <h1 className="text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[0.98] tracking-tight">Padel Social Toernooi&nbsp;#3</h1>
            <p className="max-w-[560px] text-base leading-relaxed text-mint-ink-muted lg:text-lg">
              Schrijf je in met je padelpartner en speel een ochtend vol wedstrijden: poulefase, knock-out en een prijsuitreiking aan het eind.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-4 p-4">
              <DayBadge date={DATE} />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold text-mint-lime-ink">Zondag 29 november</span>
                <span className="text-sm font-medium text-mint-ink-muted">09:30 – 14:30</span>
              </span>
            </Card>
            <Card className="flex items-center gap-4 p-4">
              <span className="flex h-[62px] w-[60px] flex-none items-center justify-center rounded-2xl bg-[#EAF1EA]">
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F6E14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-bold">Padelclub Rotterdam</span>
                <span className="text-sm font-medium text-mint-ink-muted">Korte Stadionweg 109, Feijenoord</span>
                <a href={MAPS_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold text-mint-lime-ink hover:text-mint-ink">
                  Route plannen
                </a>
              </span>
            </Card>
          </div>

          <Card radius="lg" className="scroll-mt-24 p-4 sm:p-6">
            <section id="tickets" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <Heading size="section">Tickets</Heading>
                <span className="text-[13px] font-semibold text-mint-ink-muted">via Weeztix</span>
              </div>
              <WeeztixShop guid={WEEZTIX_GUID} />
              <p className="text-[13px] font-medium text-mint-ink-muted">
                Laadt de ticketshop niet?{" "}
                <a href={`https://shop.weeztix.com/${WEEZTIX_GUID}`} target="_blank" rel="noreferrer" className="font-semibold text-mint-lime-ink hover:text-mint-ink">
                  Open hem in een nieuw tabblad
                </a>
                .
              </p>
            </section>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex flex-col gap-3 p-5">
              <Heading size="sub" className="text-xl">Zo ziet je dag eruit</Heading>
              <ol className="flex flex-col gap-2.5">
                {PROGRAM.map((item) => (
                  <li key={item.time} className="flex items-baseline gap-3">
                    <span className={`w-[92px] flex-none text-sm font-bold tabular-nums ${item.pause ? "text-mint-ink-muted" : "text-mint-lime-ink"}`}>
                      {item.time}
                    </span>
                    <span className={`text-[15px] ${item.pause ? "font-medium text-mint-ink-muted" : "font-semibold"}`}>{item.label}</span>
                  </li>
                ))}
              </ol>
            </Card>
            <Card className="flex flex-col gap-3 self-start p-5">
              <Heading size="sub" className="text-xl">Goed om te weten</Heading>
              <ul className="flex list-disc flex-col gap-2 pl-[18px] text-[15px] leading-relaxed">
                <li>Je schrijft je in als duo en speelt de hele dag met dezelfde partner.</li>
                <li>
                  <strong>Niveau:</strong> Beginners+
                </li>
                <li>
                  Vragen? Mail naar{" "}
                  <a href="mailto:info@padelsocial.nl" className="font-semibold text-mint-lime-ink hover:text-mint-ink">
                    info@padelsocial.nl
                  </a>
                  .
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
