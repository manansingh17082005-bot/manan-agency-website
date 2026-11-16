-- ALPHA CREATIVE portal schema
-- Run in Supabase SQL Editor for a NEW agency project. Review before applying.
create table if not exists public.clients (
 id uuid primary key default gen_random_uuid(), name text not null, email text, created_at timestamptz default now()
);
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, role text not null check (role in ('admin','client')),
 client_id uuid references public.clients(id) on delete set null,
 created_at timestamptz default now()
);
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 name text not null, status text not null default 'In progress', description text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.documents (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 title text not null, storage_path text not null, created_at timestamptz default now()
);
create table if not exists public.portfolio_items (
 id uuid primary key default gen_random_uuid(), title text not null, description text, media_url text,
 is_published boolean not null default false, created_at timestamptz default now()
);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(), client_id uuid references public.clients(id) on delete set null,
 name text not null, review text not null, is_approved boolean not null default false, created_at timestamptz default now()
);
alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.reviews enable row level security;
create or replace function public.is_alpha_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create policy "profiles read self or admins" on public.profiles for select to authenticated using (id=auth.uid() or public.is_alpha_admin());
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_alpha_admin()) with check (public.is_alpha_admin());
create policy "admins manage clients" on public.clients for all to authenticated using (public.is_alpha_admin()) with check (public.is_alpha_admin());
create policy "admins manage projects" on public.projects for all to authenticated using (public.is_alpha_admin()) with check (public.is_alpha_admin());
create policy "clients read own projects" on public.projects for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='client' and p.client_id=projects.client_id));
create policy "admins manage documents" on public.documents for all to authenticated using (public.is_alpha_admin()) with check (public.is_alpha_admin());
create policy "clients read own documents" on public.documents for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='client' and p.client_id=documents.client_id));
create policy "admins manage portfolio" on public.portfolio_items for all to authenticated using (public.is_alpha_admin()) with check (public.is_alpha_admin());
create policy "public read published portfolio" on public.portfolio_items for select to anon, authenticated using (is_published=true);
create policy "admins manage reviews" on public.reviews for all to authenticated using (public.is_alpha_admin()) with check (public.is_alpha_admin());
create policy "public read approved reviews" on public.reviews for select to anon, authenticated using (is_approved=true);
