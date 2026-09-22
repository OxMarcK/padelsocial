-- Public storage bucket for event flyer images (events.cover_url). Uploads go
-- through the service-role client (supabaseAdmin(), same as every other write
-- in this app) so no INSERT/UPDATE policy is needed here — only a public bucket
-- is required so getPublicUrl() reads work for anonymous visitors.
insert into storage.buckets (id, name, public)
values ('flyers', 'flyers', true)
on conflict (id) do nothing;
