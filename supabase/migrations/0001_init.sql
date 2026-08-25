-- Padel Social — Phase 1 schema.
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- No CLI required.

create extension if not exists pgcrypto;

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  date date not null,
  start_time text not null,
  location text not null,
  courts int not null default 5,
  description text not null default '',
  cover_url text,
  status text not null default 'draft'
    check (status in (
      'draft','open','poulefase','pauze_1','finale_ronde_1','pauze_2',
      'finale_ronde_2','pauze_3','finale_ronde_3','prijsuitreiking','finished'
    )),
  points_win int not null default 3,
  points_draw int not null default 1,
  points_loss int not null default 0,
  current_poule_round int not null default 1,
  created_at timestamptz not null default now()
);

-- Global: the same human accumulates history across events (see spec §3).
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  player1_id uuid not null references players(id),
  player2_id uuid not null references players(id),
  created_at timestamptz not null default now()
);

create table poules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null check (label ~ '^[A-Z]$'), -- single letter; as many poules as team count / 5 calls for
  unique (event_id, label)
);

create table poule_teams (
  id uuid primary key default gen_random_uuid(),
  poule_id uuid not null references poules(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  unique (poule_id, team_id)
);

-- Poule matches only. Kwartfinale onward are derived at read time from
-- bracket_results/placement_results + bracket-engine.ts — see supabase-repo.ts.
create table matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  round_number int not null,
  court_number int not null,
  label text not null,
  team_a_id uuid references teams(id),
  team_b_id uuid references teams(id),
  score_a int,
  score_b int,
  video_url text,
  poule_id uuid not null references poules(id)
);

-- The published top-8 seeding + placement-group seed order (admin-editable
-- draft, published once and then read-only propagation drives everything else).
create table bracket_state (
  event_id uuid primary key references events(id) on delete cascade,
  top8 jsonb not null,
  placement_seeds jsonb not null
);

create table bracket_results (
  event_id uuid not null references events(id) on delete cascade,
  match_def_id text not null, -- "KF1".."PLACE_7_8", see lib/bracket-engine.ts
  score_a int not null,
  score_b int not null,
  primary key (event_id, match_def_id)
);

create table placement_results (
  event_id uuid not null references events(id) on delete cascade,
  match_def_id text not null, -- "R1" | "R2" | "R3"
  score_a int not null,
  score_b int not null,
  primary key (event_id, match_def_id)
);

-- video_url for bracket/placement matches, which have no row of their own.
-- (Poule matches store video_url directly on `matches`.)
create table match_video (
  match_id text primary key,
  video_url text
);

create table placements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  team_id uuid not null references teams(id),
  final_rank int,
  unique (event_id, team_id)
);

-- Public-safe team view: player names only, never email/phone.
create view public_team_players as
select
  t.id as team_id,
  p1.id as player1_id, p1.name as player1_name,
  p2.id as player2_id, p2.name as player2_name
from teams t
join players p1 on p1.id = t.player1_id
join players p2 on p2.id = t.player2_id;

-- ---------------------------------------------------------------------
-- RLS. This app's own Server Actions/Server Components use the
-- service-role key (bypasses RLS) for every read and write — there is no
-- direct client-side Supabase usage. These policies are defense-in-depth
-- for if that ever changes.
-- ---------------------------------------------------------------------

alter table events enable row level security;
alter table players enable row level security;
alter table teams enable row level security;
alter table poules enable row level security;
alter table poule_teams enable row level security;
alter table matches enable row level security;
alter table bracket_state enable row level security;
alter table bracket_results enable row level security;
alter table placement_results enable row level security;
alter table match_video enable row level security;
alter table placements enable row level security;

create policy "public read non-draft events" on events for select using (status <> 'draft');
create policy "admin full access events" on events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- players: no anon policy at all — only readable via public_team_players (view owner bypasses RLS) or as admin.
create policy "admin full access players" on players for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read teams of visible events" on teams for select using (
  exists (select 1 from events e where e.id = teams.event_id and e.status <> 'draft')
);
create policy "admin full access teams" on teams for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read poules of visible events" on poules for select using (
  exists (select 1 from events e where e.id = poules.event_id and e.status <> 'draft')
);
create policy "admin full access poules" on poules for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read poule_teams of visible events" on poule_teams for select using (
  exists (select 1 from poules p join events e on e.id = p.event_id where p.id = poule_teams.poule_id and e.status <> 'draft')
);
create policy "admin full access poule_teams" on poule_teams for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read matches of visible events" on matches for select using (
  exists (select 1 from events e where e.id = matches.event_id and e.status <> 'draft')
);
create policy "admin full access matches" on matches for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read bracket_state of visible events" on bracket_state for select using (
  exists (select 1 from events e where e.id = bracket_state.event_id and e.status <> 'draft')
);
create policy "admin full access bracket_state" on bracket_state for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read bracket_results of visible events" on bracket_results for select using (
  exists (select 1 from events e where e.id = bracket_results.event_id and e.status <> 'draft')
);
create policy "admin full access bracket_results" on bracket_results for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read placement_results of visible events" on placement_results for select using (
  exists (select 1 from events e where e.id = placement_results.event_id and e.status <> 'draft')
);
create policy "admin full access placement_results" on placement_results for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read match_video" on match_video for select using (true);
create policy "admin full access match_video" on match_video for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read placements of visible events" on placements for select using (
  exists (select 1 from events e where e.id = placements.event_id and e.status <> 'draft')
);
create policy "admin full access placements" on placements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- To create an admin: Authentication → Users → Add user (email + password,
-- or send a magic link) in the Supabase dashboard. No self-serve admin signup exists.
