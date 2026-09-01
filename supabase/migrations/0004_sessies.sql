-- Weekly-session sign-up feature — fully additive, no changes to any existing table.
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  date date not null,
  start_time text not null,
  location text not null,
  courts int not null default 4,
  tikkie_url text,
  status text not null default 'draft'
    check (status in ('draft','open','closed','done')),
  created_at timestamptz not null default now()
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  member_id uuid not null references members(id),
  status text not null default 'held'
    check (status in ('held','paid','expired','cancelled')),
  reserved_at timestamptz not null default now(),
  hold_expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Only one *active* reservation per member per session — a partial index instead of
-- a plain unique(session_id, member_id), so an expired or cancelled row never blocks
-- that same person from reserving again later.
create unique index reservations_one_active_per_member
  on reservations (session_id, member_id)
  where status in ('held', 'paid');

-- RLS as defense-in-depth, matching 0001_init.sql's pattern — the app itself never
-- reads/writes these tables from anywhere but the server-role admin client, which
-- bypasses RLS entirely, so nothing here actually gates today's behavior.
alter table members enable row level security;
alter table sessions enable row level security;
alter table reservations enable row level security;

-- members: no anon policy at all, same reasoning as players (name/email/phone) — only
-- readable via the admin (authenticated) policy below.
create policy "admin full access members" on members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read non-draft sessions" on sessions for select using (status <> 'draft');
create policy "admin full access sessions" on sessions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin full access reservations" on reservations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
