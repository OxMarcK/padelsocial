# Padel Social

Taal van UI-teksten en communicatie met de eigenaar: Nederlands, informeel ("je"), kort.

## Onderdelen

- **Agenda-app** (deze Next.js-repo, `agenda.padelsocial.nl`): publieke agenda, sessie- en toernooi-aanmeldpagina's (`/[slug]`), admin onder `/admin`.
- **Homepage** (statische site, `www.padelsocial.nl`): staat in `homepage/` (git) en wordt via FTP gedeployed vanuit `/Users/marckollmann/padelsocial-nl/` (niet in git). Na elke homepage-wijziging beide mappen synchroniseren en met `diff` controleren.
- Productiedomein van de app is `agenda.padelsocial.nl`. `event.padelsocial.nl` is verouderd; gebruik het nergens meer.

## Stack

Next.js 13.5 (App Router, Server Actions), Tailwind, Supabase (Postgres + magic-link auth voor admins), Resend voor e-mail (`lib/email.ts`, raw HTTP, geen SDK), Vercel hosting.

- Data zit achter repo-interfaces met een mock- en een Supabase-implementatie (`lib/data/*`). Zonder Supabase-env draait de app op de in-memory mock-repo; die reset bij elke dev-restart. `sessions-mock-repo` seedt zichzelf uit het gitignored `lib/data/dev-seed.local.json` (zie `scripts/export-sessions-seed.mjs`, haalt alleen niet-persoonlijke sessie-data op).
- Lokaal inloggen in /admin: de magic-link is een stub, elk e-mailadres werkt.
- Sessies en toernooien zijn bewust gescheiden repo's/tabellen; alleen de publieke URL-namespace is gedeeld.
- De homepage (`app/page.tsx`) haalt vier bronnen parallel op met `withFallback`, zodat een tijdelijke Supabase-fout (timeout, "JWT issued at future") niet de hele pagina laat crashen. Houd dat zo.
- `app/error.tsx` en `app/global-error.tsx` zijn de gebrande foutpagina's.

## Design-systeem (leidraad: homepage + Agenda)

- Kleuren: ink `#0E2318`, ink-muted `#5C7266`, lime `#D2E95C`, lime-ink `#4F6E14`, achtergrond `linear-gradient(180deg, #CFE4D7 0%, #F5F8F5 55%, #DDEBE0 100%)`.
- Radius: 14 / 20 / 28 px, knoppen pill (999px).
- Font: Plus Jakarta Sans (`font-mint`). Headings: `font-extrabold tracking-tight` (weight 800, letter-spacing -.025em), ook in /admin.
- Herhaalde UI als component, niet als losse class-strings: `components/admin/section.tsx`, `components/admin/details-card.tsx`, `components/ui/*`.

## E-mail

- Verzenddomein `auth.padelsocial.nl` (Resend). Supabase's magic-link-template is handmatig in het Supabase-dashboard aangepast en staat dus niet in de repo.
- Gmail dark mode: laat de automatische inversie van gewone CSS met rust. Alleen het logo krijgt een witte doos (herhalend `public/email/white-pixel.png` als achtergrond). Centreren via een `<table role="presentation" width="100%">`-wrapper, niet via `margin: 0 auto`.

## Werkafspraken

- Nooit committen of pushen zonder expliciete opdracht ("commit en push" / "ship it").
- Voor oplevering altijd `npx tsc --noEmit` en `npx vitest run` draaien.
- UI-wijzigingen altijd zelf in de browser verifiëren voordat je ze als klaar meldt.
- Commits eindigen met de `Co-Authored-By`-regel uit de systeemprompt.
- Plak of herhaal nooit wachtwoorden of API-keys in chat en vul ze nooit zelf in formulieren in; de gebruiker doet dat zelf.
