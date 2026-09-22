-- Single-row table for landing-page content that isn't tied to any one event
-- or session — currently just the Agenda hero flyer + its link. Deliberately
-- not a column on `events`: the flyer is decided by the organizer independent
-- of which event/session happens to be "next" (e.g. announcing an event before
-- it exists in the admin yet, or promoting something other than the soonest
-- one).
create table if not exists site_settings (
  id text primary key default 'default',
  hero_flyer_url text,
  hero_flyer_link text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values ('default')
on conflict (id) do nothing;
