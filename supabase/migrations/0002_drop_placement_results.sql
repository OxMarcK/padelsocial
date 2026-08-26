-- Padel Social — drop the now-unused placement-match results table.
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- after 0001_init.sql has already been applied.

-- The verliezersronde/troostfinale/plaatsingsfinales and the separate
-- 7-team placement ladder were removed from the app: the knockout bracket
-- now only tracks kwartfinale -> halve finale -> grote finale. Ranks 3-8
-- are assigned from each losing team's original top-8 seed, and ranks 9+
-- come directly from the poulefase standing (bracket_state.placement_seeds,
-- still in active use — do not drop that column). Nothing reads or writes
-- placement_results any more, so it's safe to drop.
drop table if exists placement_results;
