-- Dayawan Village Connect - Production schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.service_applications (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_name text not null,
  phone text not null,
  service_id text not null,
  service_name text not null,
  status text not null default 'submitted' check (status in ('submitted', 'received', 'processing', 'ready', 'completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_applications_user_id on public.service_applications(user_id);
create index if not exists idx_service_applications_code on public.service_applications(code);
create index if not exists idx_service_applications_updated_at on public.service_applications(updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_service_applications_updated_at on public.service_applications;
create trigger trg_service_applications_updated_at
before update on public.service_applications
for each row
execute function public.set_updated_at();

create sequence if not exists public.service_application_code_seq start 1201;

create or replace function public.generate_service_application_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or length(trim(new.code)) = 0 then
    new.code = 'DYW-' || nextval('public.service_application_code_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_service_applications_code on public.service_applications;
create trigger trg_service_applications_code
before insert on public.service_applications
for each row
execute function public.generate_service_application_code();

alter table public.service_applications enable row level security;

drop policy if exists "service_applications_select" on public.service_applications;
create policy "service_applications_select"
on public.service_applications
for select
to authenticated
using (
  auth.uid() = user_id
  or lower(coalesce(user_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
  or lower(coalesce(auth.jwt()->'app_metadata'->>'role', '')) = 'admin'
  or lower(coalesce(auth.jwt()->'user_metadata'->>'role', '')) = 'admin'
);

drop policy if exists "service_applications_insert" on public.service_applications;
create policy "service_applications_insert"
on public.service_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and lower(coalesce(user_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
);

drop policy if exists "service_applications_update_admin" on public.service_applications;
create policy "service_applications_update_admin"
on public.service_applications
for update
to authenticated
using (
  lower(coalesce(auth.jwt()->'app_metadata'->>'role', '')) = 'admin'
  or lower(coalesce(auth.jwt()->'user_metadata'->>'role', '')) = 'admin'
)
with check (
  lower(coalesce(auth.jwt()->'app_metadata'->>'role', '')) = 'admin'
  or lower(coalesce(auth.jwt()->'user_metadata'->>'role', '')) = 'admin'
);
