-- Camp Ops schema.
-- Run this in Supabase SQL Editor.
--
-- Passwords and login accounts are managed in Supabase Authentication.
-- Create Auth users in Supabase, then add matching emails on the Camp Ops Users page.

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
values ('local-mvp', '{}'::jsonb)
on conflict (id) do nothing;

-- Future production tables. These are ready for the next pass, when the app moves
-- from "single synced JSON state" to fully queryable records and Supabase Auth.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  first_name text,
  last_name text,
  display_name text not null,
  email text,
  phone text,
  role text not null default 'worker',
  team text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id text primary key,
  name text not null,
  category text,
  notes text
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location_id text references public.locations(id),
  assigned_team text,
  assigned_user_id uuid references public.profiles(id),
  status text not null default 'open',
  priority text not null default 'normal',
  schedule_block text,
  due_time text,
  task_type text not null default 'one-time',
  subtasks jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  author_id uuid references public.profiles(id),
  body text,
  attachment_url text,
  visibility text not null default 'task',
  created_at timestamptz not null default now()
);

create table if not exists public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  requester_name text,
  requester_email text,
  location_id text references public.locations(id),
  category text,
  urgency text not null default 'normal',
  details text,
  status text not null default 'pending',
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_requests enable row level security;

drop policy if exists "Anyone can submit staff requests" on public.staff_requests;
drop policy if exists "Authenticated operators can read staff requests" on public.staff_requests;
drop policy if exists "Authenticated operators can update staff requests" on public.staff_requests;

create policy "Anyone can submit staff requests"
on public.staff_requests
for insert
to anon, authenticated
with check (true);

create policy "Authenticated operators can read staff requests"
on public.staff_requests
for select
to authenticated
using (true);

create policy "Authenticated operators can update staff requests"
on public.staff_requests
for update
to authenticated
using (true)
with check (true);

create table if not exists public.supply_requests (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  item text not null,
  location_id text references public.locations(id),
  urgency text not null default 'normal',
  note text,
  status text not null default 'requested',
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  clock_in timestamptz not null,
  clock_out timestamptz,
  note text,
  created_at timestamptz not null default now()
);
