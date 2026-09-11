-- Deleting a member with any reservation history (even just a cancelled or
-- expired one) failed outright: reservations.member_id had no ON DELETE
-- behavior, so Postgres blocked the delete with a foreign-key violation —
-- surfaced to the admin as a bare "An error occurred in the Server
-- Components render." with no explanation. Deleting a member is meant to
-- mean "remove them entirely", matching how deleting a session already
-- cascades away its reservations (session_id already has ON DELETE CASCADE
-- below) — so member_id gets the same treatment.
alter table reservations
  drop constraint if exists reservations_member_id_fkey,
  add constraint reservations_member_id_fkey
    foreign key (member_id) references members(id) on delete cascade;
