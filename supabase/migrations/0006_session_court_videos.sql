-- Per-court video link for a session, added by the admin once the session is
-- done. Keyed by court number as a jsonb object (e.g. {"1": "https://..."})
-- rather than a separate table — a small, bounded set per session, no need
-- for row-level querying.
alter table sessions
  add column court_videos jsonb not null default '{}'::jsonb;
