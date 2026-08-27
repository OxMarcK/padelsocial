# Padel Social — Event Companion (Phase 1)

Live poulefase + knock-out/placement bracket companion for padelsocial.nl events.
Built from `padel-social-event-companion-spec.md` and the Claude Design project
*Padel Social event companion app*.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. **No Supabase project is required to try the app** —
without `NEXT_PUBLIC_SUPABASE_URL` set, every page runs against an in-memory demo
data store (`lib/data/mock-repo.ts`) that lives for the life of the dev server
process. Create an event at `/admin` (any email logs you in instantly in this
mode — magic links aren't real yet), bulk-add teams, and run the whole flow.

## How an event gets set up

There is no public sign-up page — the organizer enters everything directly in
`/admin/e/[id]` before the event starts:

1. **Create the event** (name, date, location, courts) — it starts in
   `draft` ("Opzetten").
2. **Bulk-add teams** (paste `Team naam | Speler 1 | Speler 2` lines, one per
   team).
3. **Draw poules** — every poule is 5 teams; pick how many poules you want
   (2, 3, 4, ...) and hit "Willekeurig verdelen", or assign teams to poules
   manually. Team count is the only "format" lever — the knock-out stage is
   always top-8 + a placement group for everyone else, regardless of poule
   count (see `resolveTop8` in `lib/bracket-engine.ts`).
4. **Generate the poule schedule**, then advance straight from `draft` to
   `poulefase` — no "open for registration" step in between.

Teams have no status field (pending/paid/no-show) — anything the admin enters
is a confirmed team by definition, since there's no external self-signup flow
to reconcile against.

Run the test suite (the two pure logic modules — poule scheduling and bracket
propagation):

```bash
npm run test
```

## Connecting a real Supabase project

The app is written against a repository interface (`lib/data/repo.ts`) with two
implementations — `mock-repo.ts` (above) and `supabase-repo.ts` — selected
automatically by `lib/data/index.ts` based on whether Supabase env vars are set.
Switching is not a code change:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run `supabase/migrations/0001_init.sql` (no CLI
   needed — this repo doesn't include the Supabase CLI as a dependency).
3. Copy `.env.local.example` to `.env.local` and fill in the project URL, anon
   (publishable) key, and service-role (secret) key from Project Settings →
   API Keys, plus `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` locally).
   Supabase never displays the full secret key on screen — only a masked
   preview and a "Copy" button — so paste it directly into the file yourself
   rather than through a chat/clipboard round-trip; a wrapped copy-paste can
   silently split the key across two lines and break `.env` parsing.
4. In Supabase, go to Authentication → URL Configuration → Redirect URLs and
   add `http://localhost:3000/auth/callback` (and your real domain's
   equivalent once deployed). Without this, Supabase silently ignores the
   app's requested redirect and sends every magic link back to the bare Site
   URL instead, so login never reaches `/auth/callback` to establish a
   session.
5. Create an admin under Authentication → Users. Use **"Create new user"**
   with a password, or use the app's own login (`/admin/login` → "Stuur
   inloglink") once the user exists — either sends a real session-establishing
   link through `/auth/callback`. The dashboard's **"Send invitation"** flow
   uses a different, implicit-grant redirect that this app doesn't have a
   client-side handler for, so an invite email won't actually log you in;
   create the user via invite if you like, but then sign in via the app's own
   magic-link form rather than clicking the invite email's link. There's no
   self-serve admin signup by design (spec: "only 1–2 admins exist").
6. Restart `npm run dev` — Next only reads `.env.local` at startup.

`supabase/seed.sql` is not included — reuse the admin bulk-add flow (supports
pasted `Team naam | Speler 1 | Speler 2` lines) to seed real data instead.

## Why 6 poule rounds, not 5 (for the original 15-team/3-poule case)

The spec's prose describes "5 rounds of 20 minutes" for the poulefase, but its
own required test list ("4 unique matches per team... all 5 courts used every
round") is only satisfiable with **6** rounds for 3 poules on 5 courts: 3
poules × 5 teams is 30 total matches, and 5 courts × 5 rounds is only 25
court-slots — every team getting all 4 of their matches genuinely needs 5
courts × 6 rounds = 30. `lib/poule-scheduler.ts` implements the correct,
fully-tested round packing for *any* number of poules/courts (see its doc
comment for the derivation), and the app's phase-timing (`lib/schedule.ts`)
derives the real poulefase duration from whatever that comes out to, so the
displayed schedule stays internally consistent regardless of how many poules
an event has. **This shifts the real event's clock** for the 3-poule/5-court
case specifically — worth flagging to the organizer: poulefase would run
10:30–12:40 (6 rounds × 20 min play + 5 × 2 min changeover between rounds)
rather than 10:30–12:10 (the spec's naive 5-round, no-changeover assumption at
20 min/round) if run as a genuinely complete round robin on 5 courts.

## What's built (Phase 1 scope, per spec §2 and §7)

- **Pure, unit-tested logic** — `lib/poule-scheduler.ts` (circle-method round
  robin + court packing, generic across poule/court counts) and `lib/bracket-
  engine.ts` (rank-based top-8 seeding — standard 1v8/4v5/2v7/3v6 bracket
  pairing, poule-count-agnostic — full winner/loser propagation through every
  round, the 7-team-and-up placement gauntlet). 22 tests, zero framework
  imports, exactly as the spec requires.
- **Data model** matching spec §3 (minus the `teams.status` column, dropped —
  see "How an event gets set up"), implemented for both the mock store and
  real Postgres (`supabase/migrations/0001_init.sql`), including the
  `players`-table privacy boundary (public pages never see email/phone; see
  the `public_team_players` view and its RLS policies).
- **Public pages**: marketing landing (`/`), adaptive event page (`/[slug]`
  — live scoreboard / prijsuitreiking / results depending on status), TV mode
  (`/[slug]/tv`), team lookup (`/[slug]/teams`), a team detail + share
  page (`/[slug]/teams/[teamId]` — added beyond the spec's route list since
  the spec's own "tap a team, share the card" requirement needs a stable
  per-team URL), and standings (`/[slug]/standen`, poule tables + bracket
  tabs).
- **Admin control room** (`/admin`, `/admin/e/[id]`): magic-link login, event
  creation, bulk team add, manual/random poule draw (poule count is just
  however many groups of 5 you tell it to make), poule-schedule
  preview+publish, fast score entry (court picker + big steppers, matching
  the design's admin screens), phase advancement with an inline "here's what
  happens next" confirmation (spec §8), top-8 seeding preview with a manual
  override control for cross-poule tie-breaks, and video URL attachment per
  match.
- **Design system**: Tailwind tokens for the court-night / lime-serve / glass-
  blue palette, Barlow Condensed + Inter via `next/font`, the padel-court
  visual motif (`components/court-card.tsx`), and the animated standings list
  (`components/standings-list.tsx`) with the lime rank-climb flash, respecting
  `prefers-reduced-motion`.
- **PWA basics**: manifest + a hand-rolled shell-only service worker (network-
  first, so live scores never serve stale from cache).

Not built (explicitly Phase 2+ per spec §2.4/§7): player accounts, `/p/[id]`
player pages, ratings, payment integration, auto phase-timers, multi-organizer
support.

## Known trade-offs

- **Next.js 13.5.11, not 14+** — this environment's Node is 18.13.0, below
  Next 14's floor (18.17). 13.5.11 is the latest patched 13.x release; a few
  npm-audit findings remain in dev-only tooling (vitest/esbuild) and in
  `next`/`postcss` itself, fixable only by a Next 14+/16 major bump, which
  would need a Node upgrade first.
- **Realtime = ~8s polling**, not Supabase Realtime channels (spec explicitly
  allows either; polling has no subscription lifecycle to debug and works
  identically against the mock and real repos).
- **Placement ranks below 8th are approximate** by explicit spec design
  (§2.3.B) — the 7-team group only gets 3 matches on one court, so
  `lib/bracket-engine.ts` runs a documented best-effort gauntlet rather than a
  full round robin.
- **A tied knockout match is left unresolved on purpose** — `bracket-
  engine.ts` won't guess a winner from an equal score; the admin re-enters a
  decisive score (verified live during this build: HF2 briefly landed on 4–4
  and downstream rounds correctly showed "TBD" until corrected).
