-- ALPHA CREATIVE founder portal extensions. Additive only; preserves existing agreement/payment/review data.
create table if not exists public.agency_leads (
 id uuid primary key default gen_random_uuid(), name text not null, email text, phone text, business_name text,
 service_interest text, message text, source text default 'website',
 status text not null default 'new' check(status in ('new','contacted','qualified','won','lost')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.service_catalog (
 id uuid primary key default gen_random_uuid(), name text not null, short_description text,
 price_from numeric(12,2) check(price_from is null or price_from>=0), currency text not null default 'INR',
 pricing_note text, is_active boolean not null default true, sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.portfolio_items (
 id uuid primary key default gen_random_uuid(), title text not null, category text, description text,
 media_url text, thumbnail_url text, is_published boolean not null default false,
 sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists agency_leads_created_at_idx on public.agency_leads(created_at desc);
create index if not exists client_agreements_created_at_idx on public.client_agreements(created_at desc);
create index if not exists client_reviews_status_idx on public.client_reviews(status);
alter table public.agency_leads enable row level security;
alter table public.service_catalog enable row level security;
alter table public.portfolio_items enable row level security;
drop policy if exists "Owner manages agency leads" on public.agency_leads;
create policy "Owner manages agency leads" on public.agency_leads for all to authenticated
using ((select (auth.jwt()->'app_metadata'->>'role')='owner'))
with check ((select (auth.jwt()->'app_metadata'->>'role')='owner'));
drop policy if exists "Public can submit agency leads" on public.agency_leads;
create policy "Public can submit agency leads" on public.agency_leads for insert to anon,authenticated with check(status='new');
drop policy if exists "Owner manages service catalog" on public.service_catalog;
create policy "Owner manages service catalog" on public.service_catalog for all to authenticated
using ((select (auth.jwt()->'app_metadata'->>'role')='owner'))
with check ((select (auth.jwt()->'app_metadata'->>'role')='owner'));
drop policy if exists "Public can read active services" on public.service_catalog;
create policy "Public can read active services" on public.service_catalog for select to anon,authenticated using(is_active=true);
drop policy if exists "Owner manages portfolio items" on public.portfolio_items;
create policy "Owner manages portfolio items" on public.portfolio_items for all to authenticated
using ((select (auth.jwt()->'app_metadata'->>'role')='owner'))
with check ((select (auth.jwt()->'app_metadata'->>'role')='owner'));
drop policy if exists "Public can read published portfolio" on public.portfolio_items;
create policy "Public can read published portfolio" on public.portfolio_items for select to anon,authenticated using(is_published=true);
grant select,insert,update,delete on public.agency_leads to authenticated;
grant insert on public.agency_leads to anon;
grant select,insert,update,delete on public.service_catalog to authenticated;
grant select on public.service_catalog to anon;
grant select,insert,update,delete on public.portfolio_items to authenticated;
grant select on public.portfolio_items to anon;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('agency-portfolio','agency-portfolio',true,104857600,array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=104857600,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Public can view agency portfolio media" on storage.objects;
create policy "Public can view agency portfolio media" on storage.objects for select to anon,authenticated using(bucket_id='agency-portfolio');
drop policy if exists "Owner uploads agency portfolio media" on storage.objects;
create policy "Owner uploads agency portfolio media" on storage.objects for insert to authenticated
with check(bucket_id='agency-portfolio' and (select (auth.jwt()->'app_metadata'->>'role')='owner'));
drop policy if exists "Owner updates agency portfolio media" on storage.objects;
create policy "Owner updates agency portfolio media" on storage.objects for update to authenticated
using(bucket_id='agency-portfolio' and (select (auth.jwt()->'app_metadata'->>'role')='owner'))
with check(bucket_id='agency-portfolio' and (select (auth.jwt()->'app_metadata'->>'role')='owner'));
drop policy if exists "Owner deletes agency portfolio media" on storage.objects;
create policy "Owner deletes agency portfolio media" on storage.objects for delete to authenticated
using(bucket_id='agency-portfolio' and (select (auth.jwt()->'app_metadata'->>'role')='owner'));
