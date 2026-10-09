-- Een event alvast aanmaken zonder dat het op de agenda staat: verborgen
-- events komen niet op de homepage of in de og-image, maar /{slug} werkt wel.
alter table events add column if not exists hidden boolean not null default false;
