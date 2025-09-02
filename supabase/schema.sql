-- SheRages Supabase schema (Postgres)
-- Run this in your project's SQL Editor

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Optional: user profile
create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  name text,
  location text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy if not exists "select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "upsert_own_profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy if not exists "update_own_profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Community posts (public read, authed write)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  topic text not null,
  location text not null,
  ts timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

create policy if not exists "read_posts"
  on public.posts for select
  using (true);

create policy if not exists "insert_own_posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

-- Symptom log (private per user)
create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_ts bigint not null, -- store as epoch ms for simplicity
  name text not null,
  severity int not null,
  hr int,
  sys int,
  dia int,
  notes text,
  created_at timestamptz default now()
);

alter table public.symptoms enable row level security;

create policy if not exists "select_own_symptoms"
  on public.symptoms for select
  using (auth.uid() = user_id);

create policy if not exists "insert_own_symptoms"
  on public.symptoms for insert
  with check (auth.uid() = user_id);

