-- Dayawan Village Connect - Production schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id text primary key,
  category text not null check (category in ('gov', 'farm', 'online')),
  title text not null,
  description text not null,
  details text,
  required_documents jsonb not null default '[]'::jsonb,
  fee_amount numeric(10,2) not null default 0,
  fee_note text,
  payment_provider text not null default 'none' check (payment_provider in ('none', 'stripe', 'razorpay')),
  form_schema jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
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

alter table public.service_applications
  -- Backward-compatible migration for existing deployments created before new fields.
  add column if not exists submitted_payload jsonb,
  add column if not exists submitted_documents jsonb,
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_provider text,
  add column if not exists payment_reference text,
  add column if not exists amount numeric(10,2) default 0;

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

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
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
alter table public.services enable row level security;

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

drop policy if exists "services_select" on public.services;
create policy "services_select"
on public.services
for select
to anon, authenticated
using (active = true or lower(coalesce(auth.jwt()->'app_metadata'->>'role', '')) = 'admin' or lower(coalesce(auth.jwt()->'user_metadata'->>'role', '')) = 'admin');

drop policy if exists "services_manage_admin" on public.services;
create policy "services_manage_admin"
on public.services
for all
to authenticated
using (
  lower(coalesce(auth.jwt()->'app_metadata'->>'role', '')) = 'admin'
  or lower(coalesce(auth.jwt()->'user_metadata'->>'role', '')) = 'admin'
)
with check (
  lower(coalesce(auth.jwt()->'app_metadata'->>'role', '')) = 'admin'
  or lower(coalesce(auth.jwt()->'user_metadata'->>'role', '')) = 'admin'
);

insert into public.services (id, category, title, description, details, required_documents, fee_amount, fee_note, payment_provider, form_schema, active)
values
  ('aadhaar', 'gov', 'Aadhaar Card Service', 'New Aadhaar, update, correction', 'New Aadhaar enrolment, name/address/DOB correction and mobile update — all in one place.', '["ID proof", "Address proof", "Photo"]'::jsonb, 50, 'From ₹50', 'none', '[{"id":"aadhaar-gender","key":"gender","label":"Gender","type":"text","required":false}]'::jsonb, true),
  ('pan', 'gov', 'PAN Card', 'New PAN card and corrections', 'New PAN application, corrections and re-print — quickly.', '["Aadhaar card", "Birth certificate"]'::jsonb, 107, 'From ₹107', 'stripe', '[{"id":"pan-father-name","key":"father_name","label":"Father Name","type":"text","required":true}]'::jsonb, true),
  ('rationcard', 'gov', 'Ration Card', 'New ration card, add member', 'Apply for new ration card and member updates.', '["Aadhaar card", "Income certificate"]'::jsonb, 0, 'Nominal fee', 'none', '[]'::jsonb, true),
  ('pmkisan', 'farm', 'PM Kisan Yojana', '₹6000/year support for farmers', 'Enrolment and updates for PM Kisan assistance.', '["Aadhaar card", "7/12 land record", "Bank passbook"]'::jsonb, 0, 'Free enrolment', 'none', '[]'::jsonb, true),
  ('cropinsurance', 'farm', 'Crop Insurance', 'Protection from natural calamities', 'Crop insurance registration and claim support.', '["7/12 record", "Aadhaar card"]'::jsonb, 0, null, 'none', '[]'::jsonb, true),
  ('soilcard', 'farm', 'Soil Health Card', 'Soil testing and advice', 'Register for soil health card and land sample guidance.', '["7/12 record"]'::jsonb, 0, null, 'none', '[]'::jsonb, true),
  ('bill', 'online', 'Electricity / Water Bill', 'Pay all bills at one place', 'Bill payment support for electricity and water services.', '["Bill copy"]'::jsonb, 0, null, 'razorpay', '[{"id":"bill-consumer","key":"consumer_number","label":"Consumer Number","type":"text","required":true}]'::jsonb, true),
  ('recharge', 'online', 'Mobile Recharge / DTH', 'All networks and DTH', 'Recharge support for all operators.', '["Mobile number"]'::jsonb, 0, null, 'razorpay', '[]'::jsonb, true),
  ('print', 'online', 'Print / Xerox / Scan', 'Affordable document services', 'Print, photocopy and scan support.', '["Original document"]'::jsonb, 0, null, 'none', '[]'::jsonb, true)
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  details = excluded.details,
  required_documents = excluded.required_documents,
  fee_amount = excluded.fee_amount,
  fee_note = excluded.fee_note,
  payment_provider = excluded.payment_provider,
  form_schema = excluded.form_schema,
  active = excluded.active,
  updated_at = now();

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
