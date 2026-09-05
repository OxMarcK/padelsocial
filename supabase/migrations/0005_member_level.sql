-- Persists the "hoe speel je?" level a member picks on first self-service
-- signup — not used for court assignment yet, but stored from day one so
-- that feature can be built later without a data backfill.
alter table members
  add column level text check (level in ('beginner', 'beginner_plus', 'intermediate'));
