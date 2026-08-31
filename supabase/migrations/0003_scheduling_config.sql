-- Per-event changeover/pauze durations, editable in Instellingen instead of the
-- fixed 2/4/2/2-minute constants the schedule used to hardcode — the first real
-- event ran those too tight. Advisory only: drives the displayed schedule/
-- countdown, never blocks or auto-advances anything (see lib/schedule.ts).
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

alter table events
  add column poule_changeover_minutes int not null default 3,
  add column pauze_after_poulefase_minutes int not null default 5,
  add column pauze_after_kwartfinale_minutes int not null default 3,
  add column pauze_after_halve_finale_minutes int not null default 3;
