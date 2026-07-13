-- Camp Ops production schema.
-- Run this in Supabase SQL Editor.
--
-- Passwords and login sessions are handled by Supabase Auth.
-- Camp Ops user access is matched by email in app data/profiles.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Conflict-safe app snapshot used by the current offline-first app.
-- The app now merges per record using _updatedAt, _clientId, and tombstones
-- before writing this row, so different devices can safely sync later.
create table if not exists public.app_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Authenticated operators can read app state" on public.app_state;
drop policy if exists "Authenticated operators can write app state" on public.app_state;

create policy "Authenticated operators can read app state"
on public.app_state
for select
to authenticated
using (true);

create policy "Authenticated operators can write app state"
on public.app_state
for all
to authenticated
using (true)
with check (true);

insert into public.app_state (id, data)
values ('camp-ops-main', coalesce((select data from public.app_state where id = 'local-mvp'), '{}'::jsonb))
on conflict (id) do nothing;

-- Queryable production tables. These mirror the app's text IDs so the app can
-- migrate record-by-record without losing existing local/offline data.
create table if not exists public.profiles (
  id text primary key,
  auth_user_id uuid references auth.users(id) on delete set null,
  first_name text,
  last_name text,
  display_name text not null,
  email text unique,
  phone text,
  role text not null default 'worker',
  team text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.locations (
  id text primary key,
  name text not null,
  category text,
  notes text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  location_id text references public.locations(id),
  assigned_team text,
  assigned_user_id text references public.profiles(id),
  status text not null default 'open',
  priority text not null default 'normal',
  schedule_block text,
  due_time text,
  task_type text not null default 'one-time',
  category text,
  cost_estimate numeric not null default 0,
  cost_actual numeric not null default 0,
  subtasks jsonb not null default '[]'::jsonb,
  chat jsonb not null default '[]'::jsonb,
  created_by text references public.profiles(id),
  completed_by text references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.staff_requests (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  requester_name text,
  requester_email text,
  created_by_id text references public.profiles(id),
  location_id text references public.locations(id),
  category text,
  urgency text not null default 'normal',
  details text,
  status text not null default 'pending',
  task_id text references public.tasks(id),
  chat jsonb not null default '[]'::jsonb,
  cost_estimate numeric not null default 0,
  cost_actual numeric not null default 0,
  approved_by text references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.supply_requests (
  id text primary key,
  category text not null,
  item text not null,
  location_id text references public.locations(id),
  urgency text not null default 'normal',
  note text,
  status text not null default 'requested',
  quantity numeric not null default 1,
  unit text not null default 'each',
  vendor text,
  tracking_number text,
  order_note text,
  requested_by text references public.profiles(id),
  ordered_by text references public.profiles(id),
  inventory_id text,
  ordered_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.inventory_items (
  id text primary key,
  item text not null,
  category text,
  manufacturer text,
  sku text,
  color text,
  size text,
  item_url text,
  codes text,
  quantity numeric not null default 0,
  unit text not null default 'each',
  package_count numeric not null default 0,
  package_qty numeric not null default 1,
  low_at numeric not null default 0,
  request_qty numeric not null default 1,
  auto_request boolean not null default false,
  auto_request_to text references public.profiles(id),
  purchase_date date,
  purchased_by text,
  purchase_store text,
  locations jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.time_entries (
  id text primary key,
  user_id text references public.profiles(id),
  clock_in timestamptz not null,
  clock_out timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  endpoint text not null,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_email text,
  target_user_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'locations', 'tasks', 'staff_requests', 'supply_requests',
    'inventory_items', 'time_entries', 'push_subscriptions'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.tasks enable row level security;
alter table public.staff_requests enable row level security;
alter table public.supply_requests enable row level security;
alter table public.inventory_items enable row level security;
alter table public.time_entries enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Authenticated can read profiles" on public.profiles;
drop policy if exists "Authenticated can write profiles" on public.profiles;
create policy "Authenticated can read profiles" on public.profiles for select to authenticated using (true);
create policy "Authenticated can write profiles" on public.profiles for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can read locations" on public.locations;
drop policy if exists "Authenticated can write locations" on public.locations;
create policy "Authenticated can read locations" on public.locations for select to authenticated using (true);
create policy "Authenticated can write locations" on public.locations for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can read tasks" on public.tasks;
drop policy if exists "Authenticated can write tasks" on public.tasks;
create policy "Authenticated can read tasks" on public.tasks for select to authenticated using (true);
create policy "Authenticated can write tasks" on public.tasks for all to authenticated using (true) with check (true);

drop policy if exists "Anyone can submit staff requests" on public.staff_requests;
drop policy if exists "Authenticated operators can read staff requests" on public.staff_requests;
drop policy if exists "Authenticated operators can update staff requests" on public.staff_requests;
drop policy if exists "Authenticated operators can delete staff requests" on public.staff_requests;
create policy "Anyone can submit staff requests" on public.staff_requests for insert to anon, authenticated with check (true);
create policy "Authenticated operators can read staff requests" on public.staff_requests for select to authenticated using (deleted_at is null);
create policy "Authenticated operators can update staff requests" on public.staff_requests for update to authenticated using (true) with check (true);
create policy "Authenticated operators can delete staff requests" on public.staff_requests for delete to authenticated using (true);

drop policy if exists "Authenticated can read supply requests" on public.supply_requests;
drop policy if exists "Authenticated can write supply requests" on public.supply_requests;
create policy "Authenticated can read supply requests" on public.supply_requests for select to authenticated using (deleted_at is null);
create policy "Authenticated can write supply requests" on public.supply_requests for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can read inventory" on public.inventory_items;
drop policy if exists "Authenticated can write inventory" on public.inventory_items;
create policy "Authenticated can read inventory" on public.inventory_items for select to authenticated using (deleted_at is null);
create policy "Authenticated can write inventory" on public.inventory_items for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated can read time entries" on public.time_entries;
drop policy if exists "Authenticated can write time entries" on public.time_entries;
create policy "Authenticated can read time entries" on public.time_entries for select to authenticated using (true);
create policy "Authenticated can write time entries" on public.time_entries for all to authenticated using (true) with check (true);

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
create policy "Users can manage own push subscriptions" on public.push_subscriptions
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can read admin audit" on public.admin_audit_log;
drop policy if exists "Authenticated can insert admin audit" on public.admin_audit_log;
create policy "Authenticated can read admin audit" on public.admin_audit_log for select to authenticated using (true);
create policy "Authenticated can insert admin audit" on public.admin_audit_log for insert to authenticated with check (true);
