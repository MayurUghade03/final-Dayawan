-- Dayawan Village Connect - Production schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id text primary key,
  category text not null check (category in ('gov', 'farm', 'online')),
  title text not null,
  description text not null,
  details text,
  image_url text,
  required_documents jsonb not null default '[]'::jsonb,
  fee_amount numeric(10,2) not null default 0,
  fee_note text,
  payment_provider text not null default 'none' check (payment_provider in ('none', 'stripe', 'razorpay')),
  form_schema jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'User',
  phone text,
  role text not null default 'citizen' check (role in ('admin', 'citizen')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists theme_mode text not null default 'system',
  add column if not exists preferred_theme_id text;

alter table public.user_profiles
  drop constraint if exists user_profiles_theme_mode_check,
  add constraint user_profiles_theme_mode_check check (theme_mode in ('light', 'dark', 'system'));

create table if not exists public.app_themes (
  id text primary key,
  name text not null,
  description text,
  appearance text not null default 'light' check (appearance in ('light', 'dark')),
  tokens jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  built_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_theme_settings (
  id int primary key default 1 check (id = 1),
  default_theme_id text not null references public.app_themes(id),
  updated_at timestamptz not null default now()
);

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
  submitted_payload jsonb,
  submitted_documents jsonb,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  payment_provider text check (payment_provider in ('none', 'stripe', 'razorpay')),
  payment_reference text,
  amount numeric(10,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  source text not null default 'website-contact-form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_applications
  -- Backward-compatible migration for existing deployments created before new fields.
  add column if not exists submitted_payload jsonb,
  add column if not exists submitted_documents jsonb,
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_provider text,
  add column if not exists payment_reference text,
  add column if not exists amount numeric(10,2) default 0;

alter table public.services
  add column if not exists image_url text;

update public.service_applications
set payment_status = coalesce(payment_status, 'pending')
where payment_status is null;

alter table public.service_applications
  alter column payment_status set not null;

alter table public.service_applications
  drop constraint if exists service_applications_payment_status_check,
  add constraint service_applications_payment_status_check check (payment_status in ('pending', 'paid'));

alter table public.service_applications
  drop constraint if exists service_applications_payment_provider_check,
  add constraint service_applications_payment_provider_check check (payment_provider is null or payment_provider in ('none', 'stripe', 'razorpay'));

create index if not exists idx_services_active on public.services(active);
create index if not exists idx_service_applications_user_id on public.service_applications(user_id);
create index if not exists idx_service_applications_code on public.service_applications(code);
create index if not exists idx_service_applications_updated_at on public.service_applications(updated_at desc);
create index if not exists idx_contact_requests_status on public.contact_requests(status);
create index if not exists idx_contact_requests_created_at on public.contact_requests(created_at desc);

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

drop trigger if exists trg_contact_requests_updated_at on public.contact_requests;
create trigger trg_contact_requests_updated_at
before update on public.contact_requests
for each row
execute function public.set_updated_at();

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_app_themes_updated_at on public.app_themes;
create trigger trg_app_themes_updated_at
before update on public.app_themes
for each row
execute function public.set_updated_at();

drop trigger if exists trg_app_theme_settings_updated_at on public.app_theme_settings;
create trigger trg_app_theme_settings_updated_at
before update on public.app_theme_settings
for each row
execute function public.set_updated_at();

create or replace function public.sync_user_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_role text;
  user_role text;
begin
  app_role := lower(coalesce(new.raw_app_meta_data->>'role', ''));
  user_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));

  insert into public.user_profiles (id, email, full_name, role, status)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user@example.com'), '@', 1), 'User'),
    case when app_role = 'admin' or user_role = 'admin' then 'admin' else 'citizen' end,
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.user_profiles.full_name),
    role = case
      when app_role = 'admin' or user_role = 'admin' then 'admin'
      else public.user_profiles.role
    end;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_profiles on auth.users;
create trigger trg_auth_user_profiles
after insert or update on auth.users
for each row
execute function public.sync_user_profile_from_auth();

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

create or replace function public.current_user_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  jwt_role text;
  profile_role text;
begin
  jwt_role := lower(coalesce(auth.jwt()->'app_metadata'->>'role', auth.jwt()->'user_metadata'->>'role', ''));
  if jwt_role = 'admin' then
    return 'admin';
  end if;

  select role
    into profile_role
  from public.user_profiles
  where id = auth.uid()
  limit 1;

  if lower(coalesce(profile_role, '')) = 'admin' then
    return 'admin';
  end if;

  return 'citizen';
end;
$$;

create or replace function public.is_user_suspended()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and up.status = 'suspended'
  );
$$;

alter table public.service_applications enable row level security;
alter table public.services enable row level security;
alter table public.user_profiles enable row level security;
alter table public.app_themes enable row level security;
alter table public.app_theme_settings enable row level security;
alter table public.contact_requests enable row level security;

drop policy if exists "service_applications_select" on public.service_applications;
create policy "service_applications_select"
on public.service_applications
for select
to authenticated
using (
  auth.uid() = user_id
  or lower(coalesce(user_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
  or public.current_user_role() = 'admin'
);

drop policy if exists "service_applications_insert" on public.service_applications;
create policy "service_applications_insert"
on public.service_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and lower(coalesce(user_email, '')) = lower(coalesce(auth.jwt()->>'email', ''))
  and public.current_user_role() <> 'admin'
  and not public.is_user_suspended()
);

drop policy if exists "service_applications_update_admin" on public.service_applications;
create policy "service_applications_update_admin"
on public.service_applications
for update
to authenticated
using (
  public.current_user_role() = 'admin'
)
with check (
  public.current_user_role() = 'admin'
);

drop policy if exists "services_select" on public.services;
create policy "services_select"
on public.services
for select
to anon, authenticated
using (active = true or public.current_user_role() = 'admin');

drop policy if exists "services_manage_admin" on public.services;
create policy "services_manage_admin"
on public.services
for all
to authenticated
using (
  public.current_user_role() = 'admin'
)
with check (
  public.current_user_role() = 'admin'
);

drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select"
on public.user_profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.current_user_role() = 'admin'
);

drop policy if exists "user_profiles_update_admin" on public.user_profiles;
create policy "user_profiles_update_admin"
on public.user_profiles
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "user_profiles_insert_self" on public.user_profiles;
create policy "user_profiles_insert_self"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "app_themes_select" on public.app_themes;
create policy "app_themes_select"
on public.app_themes
for select
to anon, authenticated
using (active = true or public.current_user_role() = 'admin');

drop policy if exists "app_themes_manage_admin" on public.app_themes;
create policy "app_themes_manage_admin"
on public.app_themes
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "app_theme_settings_select" on public.app_theme_settings;
create policy "app_theme_settings_select"
on public.app_theme_settings
for select
to anon, authenticated
using (true);

drop policy if exists "app_theme_settings_manage_admin" on public.app_theme_settings;
create policy "app_theme_settings_manage_admin"
on public.app_theme_settings
for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "contact_requests_insert_public" on public.contact_requests;
create policy "contact_requests_insert_public"
on public.contact_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "contact_requests_select_admin" on public.contact_requests;
create policy "contact_requests_select_admin"
on public.contact_requests
for select
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "contact_requests_manage_admin" on public.contact_requests;
create policy "contact_requests_manage_admin"
on public.contact_requests
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

insert into public.user_profiles (id, email, full_name, role, status)
select
  u.id,
  lower(coalesce(u.email, '')),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email, 'user@example.com'), '@', 1), 'User'),
  case
    when lower(coalesce(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', '')) = 'admin' then 'admin'
    else 'citizen'
  end,
  'active'
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name;

insert into public.app_themes (id, name, description, appearance, tokens, active, built_in)
values
  (
    'theme-light-default',
    'Light',
    'Clean light palette',
    'light',
    jsonb_build_object(
      'background', '0 0% 100%',
      'foreground', '220 38% 12%',
      'card', '0 0% 100%',
      'card-foreground', '220 38% 12%',
      'popover', '0 0% 100%',
      'popover-foreground', '220 38% 12%',
      'primary', '217 89% 44%',
      'primary-foreground', '0 0% 100%',
      'primary-soft', '214 100% 96%',
      'primary-hover', '217 89% 39%',
      'secondary', '220 14% 20%',
      'secondary-foreground', '0 0% 100%',
      'secondary-soft', '220 16% 94%',
      'muted', '220 14% 96%',
      'muted-foreground', '220 10% 44%',
      'accent', '214 100% 96%',
      'accent-foreground', '217 89% 37%',
      'destructive', '0 72% 50%',
      'destructive-foreground', '0 0% 100%',
      'success', '152 56% 38%',
      'warning', '38 92% 50%',
      'info', '199 89% 48%',
      'border', '220 13% 89%',
      'input', '220 13% 89%',
      'ring', '217 89% 44%',
      'sidebar-background', '0 0% 98%',
      'sidebar-foreground', '240 5.3% 26.1%',
      'sidebar-primary', '217 89% 44%',
      'sidebar-primary-foreground', '0 0% 100%',
      'sidebar-accent', '214 100% 96%',
      'sidebar-accent-foreground', '217 89% 37%',
      'sidebar-border', '220 13% 89%',
      'sidebar-ring', '217 89% 44%',
      'gradient-hero', 'radial-gradient(1100px 520px at 90% -10%, hsl(217 89% 44% / 0.10), transparent 60%), radial-gradient(700px 340px at -10% 110%, hsl(220 16% 78% / 0.22), transparent 60%)'
    ),
    true,
    true
  ),
  (
    'theme-dark-default',
    'Dark',
    'Accessible dark palette',
    'dark',
    jsonb_build_object(
      'background', '222 22% 12%',
      'foreground', '210 26% 94%',
      'card', '222 20% 15%',
      'card-foreground', '210 26% 94%',
      'popover', '222 20% 15%',
      'popover-foreground', '210 26% 94%',
      'primary', '212 100% 64%',
      'primary-foreground', '224 38% 10%',
      'primary-soft', '217 44% 22%',
      'primary-hover', '212 100% 69%',
      'secondary', '216 16% 84%',
      'secondary-foreground', '224 38% 12%',
      'secondary-soft', '218 25% 20%',
      'muted', '218 25% 20%',
      'muted-foreground', '216 12% 74%',
      'accent', '217 44% 22%',
      'accent-foreground', '212 100% 74%',
      'destructive', '0 78% 60%',
      'destructive-foreground', '0 0% 100%',
      'success', '152 60% 45%',
      'warning', '38 92% 56%',
      'info', '199 90% 61%',
      'border', '218 19% 27%',
      'input', '218 19% 27%',
      'ring', '212 100% 64%',
      'sidebar-background', '224 24% 11%',
      'sidebar-foreground', '216 22% 91%',
      'sidebar-primary', '212 100% 64%',
      'sidebar-primary-foreground', '224 38% 10%',
      'sidebar-accent', '217 44% 22%',
      'sidebar-accent-foreground', '212 100% 74%',
      'sidebar-border', '218 19% 27%',
      'sidebar-ring', '212 100% 64%',
      'gradient-hero', 'radial-gradient(1100px 520px at 90% -10%, hsl(212 100% 64% / 0.18), transparent 60%), radial-gradient(700px 340px at -10% 110%, hsl(220 30% 45% / 0.20), transparent 60%)'
    ),
    true,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  appearance = excluded.appearance,
  tokens = excluded.tokens,
  active = excluded.active,
  built_in = excluded.built_in,
  updated_at = now();

insert into public.app_theme_settings (id, default_theme_id)
values (1, 'theme-light-default')
on conflict (id) do update set
  default_theme_id = excluded.default_theme_id,
  updated_at = now();

insert into storage.buckets (id, name, public)
values ('application-documents', 'application-documents', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "application_documents_select" on storage.objects;
create policy "application_documents_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'application-documents'
  and (owner = auth.uid() or public.current_user_role() = 'admin')
);

drop policy if exists "application_documents_insert" on storage.objects;
create policy "application_documents_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'application-documents'
  and owner = auth.uid()
  and public.current_user_role() <> 'admin'
  and not public.is_user_suspended()
);

drop policy if exists "application_documents_manage_admin" on storage.objects;
create policy "application_documents_manage_admin"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'application-documents'
  and public.current_user_role() = 'admin'
)
with check (
  bucket_id = 'application-documents'
  and public.current_user_role() = 'admin'
);

insert into public.services (id, category, title, description, details, image_url, required_documents, fee_amount, fee_note, payment_provider, form_schema, active)
values
  ('aadhaar', 'gov', 'Aadhaar Card Service', 'New Aadhaar, update, correction', 'New Aadhaar enrolment, name/address/DOB correction and mobile update — all in one place.', null, '["ID proof", "Address proof", "Photo"]'::jsonb, 50, 'From ₹50', 'none', '[{"id":"aadhaar-gender","key":"gender","label":"Gender","type":"text","required":false}]'::jsonb, true),
  ('pan', 'gov', 'PAN Card', 'New PAN card and corrections', 'New PAN application, corrections and re-print — quickly.', null, '["Aadhaar card", "Birth certificate"]'::jsonb, 107, 'From ₹107', 'stripe', '[{"id":"pan-father-name","key":"father_name","label":"Father Name","type":"text","required":true}]'::jsonb, true),
  ('rationcard', 'gov', 'Ration Card', 'New ration card, add member', 'Apply for new ration card and member updates.', null, '["Aadhaar card", "Income certificate"]'::jsonb, 0, 'Nominal fee', 'none', '[]'::jsonb, true),
  ('pmkisan', 'farm', 'PM Kisan Yojana', '₹6000/year support for farmers', 'Enrolment and updates for PM Kisan assistance.', null, '["Aadhaar card", "7/12 land record", "Bank passbook"]'::jsonb, 0, 'Free enrolment', 'none', '[]'::jsonb, true),
  ('cropinsurance', 'farm', 'Crop Insurance', 'Protection from natural calamities', 'Crop insurance registration and claim support.', null, '["7/12 record", "Aadhaar card"]'::jsonb, 0, null, 'none', '[]'::jsonb, true),
  ('soilcard', 'farm', 'Soil Health Card', 'Soil testing and advice', 'Register for soil health card and land sample guidance.', null, '["7/12 record"]'::jsonb, 0, null, 'none', '[]'::jsonb, true),
  ('bill', 'online', 'Electricity / Water Bill', 'Pay all bills at one place', 'Bill payment support for electricity and water services.', null, '["Bill copy"]'::jsonb, 0, null, 'razorpay', '[{"id":"bill-consumer","key":"consumer_number","label":"Consumer Number","type":"text","required":true}]'::jsonb, true),
  ('recharge', 'online', 'Mobile Recharge / DTH', 'All networks and DTH', 'Recharge support for all operators.', null, '["Mobile number"]'::jsonb, 0, null, 'razorpay', '[]'::jsonb, true),
  ('print', 'online', 'Print / Xerox / Scan', 'Affordable document services', 'Print, photocopy and scan support.', null, '["Original document"]'::jsonb, 0, null, 'none', '[]'::jsonb, true)
on conflict (id) do nothing;

-- Bootstrap admin user for first login
-- Email: admin@dayawan.local
-- Password: Admin@123
-- Change credentials immediately in production.
do $$
declare
  admin_uid uuid;
begin
  if not exists (select 1 from auth.users where email = 'admin@dayawan.local') then
    admin_uid := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      coalesce((select instance_id from auth.users order by created_at asc limit 1), '00000000-0000-0000-0000-000000000000'::uuid),
      admin_uid,
      'authenticated',
      'authenticated',
      'admin@dayawan.local',
      crypt('Admin@123', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"full_name":"Dayawan Admin","role":"admin"}'::jsonb,
      false,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(),
      admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', 'admin@dayawan.local'),
      'email',
      admin_uid::text,
      now(),
      now(),
      now()
    );
  end if;
exception
  when others then
    raise notice 'Admin bootstrap skipped: %', sqlerrm;
end $$;
