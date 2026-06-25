-- Cut Sew Print — initial schema
-- Profiles, patterns, and likes with Row Level Security.
-- Auth is username + password only (no email/PII); usernames are stored here.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     citext not null unique,
  display_name text,
  bio          text,
  created_at   timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,24}$')
);

-- ---------------------------------------------------------------------------
-- patterns
-- ---------------------------------------------------------------------------
create table if not exists public.patterns (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled Pattern',
  description text,
  is_public   boolean not null default false,
  units       text not null default 'in' check (units in ('in', 'cm', 'mm', 'm', 'ft')),
  document    jsonb not null default '{}'::jsonb,
  thumbnail   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists patterns_owner_idx on public.patterns (owner_id);
create index if not exists patterns_public_idx on public.patterns (created_at desc) where is_public;

-- ---------------------------------------------------------------------------
-- pattern_likes
-- ---------------------------------------------------------------------------
create table if not exists public.pattern_likes (
  pattern_id uuid not null references public.patterns (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pattern_id, user_id)
);

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------

-- keep patterns.updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patterns_set_updated_at on public.patterns;
create trigger patterns_set_updated_at
  before update on public.patterns
  for each row execute function public.set_updated_at();

-- create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.patterns enable row level security;
alter table public.pattern_likes enable row level security;

-- profiles: world-readable usernames; users manage their own row
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- patterns: public ones are readable by all; owners have full control
drop policy if exists "Public or own patterns are viewable" on public.patterns;
create policy "Public or own patterns are viewable"
  on public.patterns for select using (is_public or auth.uid() = owner_id);

drop policy if exists "Users can insert own patterns" on public.patterns;
create policy "Users can insert own patterns"
  on public.patterns for insert with check (auth.uid() = owner_id);

drop policy if exists "Users can update own patterns" on public.patterns;
create policy "Users can update own patterns"
  on public.patterns for update using (auth.uid() = owner_id);

drop policy if exists "Users can delete own patterns" on public.patterns;
create policy "Users can delete own patterns"
  on public.patterns for delete using (auth.uid() = owner_id);

-- likes: visible to all; users manage their own likes
drop policy if exists "Likes are viewable by everyone" on public.pattern_likes;
create policy "Likes are viewable by everyone"
  on public.pattern_likes for select using (true);

drop policy if exists "Users can like" on public.pattern_likes;
create policy "Users can like"
  on public.pattern_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unlike" on public.pattern_likes;
create policy "Users can unlike"
  on public.pattern_likes for delete using (auth.uid() = user_id);
