-- Sessions used to assume baannummers were always 1..courts. In practice a
-- club's own numbering rarely starts at 1 or runs consecutively, so this
-- replaces the plain "courts" count with the actual list of baannummers.
-- Backfill existing rows with [1..courts] so nothing changes visually for
-- sessions that already exist.
alter table sessions
  add column court_numbers jsonb not null default '[]'::jsonb;

update sessions
set court_numbers = to_jsonb(array(select generate_series(1, courts)))
where court_numbers = '[]'::jsonb;

-- The old "courts" column is no longer written to by the app, but it's left
-- in place rather than dropped — nothing here depends on removing it, and
-- dropping a column is a one-way door.
