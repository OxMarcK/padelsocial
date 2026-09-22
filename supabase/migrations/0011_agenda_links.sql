-- Lightweight, manually-added agenda entries that link out to an external
-- page instead of an internal /{slug} — see lib/data/agenda-links.ts for the
-- reasoning (kept deliberately separate from `events`/`sessions`).
create table if not exists agenda_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time text not null,
  location text not null,
  link text not null,
  created_at timestamptz not null default now()
);
