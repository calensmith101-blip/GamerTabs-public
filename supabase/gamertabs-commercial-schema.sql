-- GamerTabs commercial SaaS Supabase schema / RLS fix
-- ONE APP = ONE CODEBASE = ONE URL
-- Run this in Supabase SQL Editor for the GamerTabs project.
-- Safe to rerun: it creates/repairs tables, removes old policies, and recreates secure ownership policies.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Shared updated_at trigger helper
-- ─────────────────────────────────────────────────────────────
create or replace function public.gamertabs_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- App subscription access, written by server-side Stripe webhook only
-- Frontend must NEVER be able to write this table.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.app_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null default 'gamertabs',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'none',
  current_period_end timestamptz,
  grace_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_subscriptions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.app_subscriptions add column if not exists app_id text default 'gamertabs';
alter table public.app_subscriptions add column if not exists stripe_customer_id text;
alter table public.app_subscriptions add column if not exists stripe_subscription_id text;
alter table public.app_subscriptions add column if not exists status text default 'none';
alter table public.app_subscriptions add column if not exists current_period_end timestamptz;
alter table public.app_subscriptions add column if not exists grace_period_end timestamptz;
alter table public.app_subscriptions add column if not exists created_at timestamptz default now();
alter table public.app_subscriptions add column if not exists updated_at timestamptz default now();

update public.app_subscriptions set app_id = 'gamertabs' where app_id is null;
update public.app_subscriptions set status = 'none' where status is null;
update public.app_subscriptions set created_at = now() where created_at is null;
update public.app_subscriptions set updated_at = now() where updated_at is null;

-- Remove duplicate subscription rows before adding the unique key needed by API upsert.
delete from public.app_subscriptions a
using public.app_subscriptions b
where a.ctid < b.ctid
  and a.user_id = b.user_id
  and coalesce(a.app_id, 'gamertabs') = coalesce(b.app_id, 'gamertabs');

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_subscriptions_user_app_unique'
      and conrelid = 'public.app_subscriptions'::regclass
  ) then
    alter table public.app_subscriptions
      add constraint app_subscriptions_user_app_unique unique (user_id, app_id);
  end if;
exception when others then
  raise notice 'Could not add app_subscriptions_user_app_unique: %', sqlerrm;
end $$;

create index if not exists idx_app_subscriptions_customer on public.app_subscriptions (stripe_customer_id);
create index if not exists idx_app_subscriptions_subscription on public.app_subscriptions (stripe_subscription_id);

-- Server-side access helper. This is what RLS uses to stop unpaid users bypassing the frontend.
create or replace function public.has_gamertabs_full_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_subscriptions s
    where s.user_id = auth.uid()
      and s.app_id = 'gamertabs'
      and (
        s.status in ('active', 'trialing')
        or (
          s.status in ('past_due', 'unpaid', 'incomplete')
          and coalesce(s.grace_period_end, s.current_period_end + interval '5 days') >= now()
        )
      )
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Profiles: user-owned account/player data. Do not store customer email here.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  points integer not null default 0,
  crowns integer not null default 0,
  level integer not null default 1,
  wins integer not null default 0,
  losses integer not null default 0,
  town text,
  suburb text,
  state text,
  country text,
  local_discovery_enabled boolean not null default false,
  is_online boolean not null default false,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists points integer default 0;
alter table public.profiles add column if not exists crowns integer default 0;
alter table public.profiles add column if not exists level integer default 1;
alter table public.profiles add column if not exists wins integer default 0;
alter table public.profiles add column if not exists losses integer default 0;
alter table public.profiles add column if not exists town text;
alter table public.profiles add column if not exists suburb text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists local_discovery_enabled boolean default false;
alter table public.profiles add column if not exists is_online boolean default false;
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

update public.profiles set points = 0 where points is null;
update public.profiles set crowns = 0 where crowns is null;
update public.profiles set level = 1 where level is null;
update public.profiles set wins = 0 where wins is null;
update public.profiles set losses = 0 where losses is null;
update public.profiles set local_discovery_enabled = false where local_discovery_enabled is null;
update public.profiles set is_online = false where is_online is null;
update public.profiles set created_at = now() where created_at is null;
update public.profiles set updated_at = now() where updated_at is null;

-- Remove old public email column if it exists. Catch failures so dependent old views do not kill the whole migration.
do $$
begin
  begin
    alter table public.profiles drop column if exists email;
  exception when others then
    raise notice 'Could not drop profiles.email automatically: %', sqlerrm;
  end;
end $$;

create index if not exists idx_profiles_discovery on public.profiles (local_discovery_enabled, last_seen desc);
create index if not exists idx_profiles_username on public.profiles (username);

-- ─────────────────────────────────────────────────────────────
-- Paid-user cloud save mirror. Direct DB access is protected by RLS too.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null default 'gamertabs',
  save_key text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_saves add column if not exists id uuid default gen_random_uuid();
alter table public.game_saves add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.game_saves add column if not exists app_id text default 'gamertabs';
alter table public.game_saves add column if not exists save_key text;
alter table public.game_saves add column if not exists payload jsonb;
alter table public.game_saves add column if not exists created_at timestamptz default now();
alter table public.game_saves add column if not exists updated_at timestamptz default now();

update public.game_saves set app_id = 'gamertabs' where app_id is null;
update public.game_saves set created_at = now() where created_at is null;
update public.game_saves set updated_at = now() where updated_at is null;

delete from public.game_saves a
using public.game_saves b
where a.ctid < b.ctid
  and a.user_id = b.user_id
  and coalesce(a.app_id, 'gamertabs') = coalesce(b.app_id, 'gamertabs')
  and a.save_key = b.save_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'game_saves_user_app_key_unique'
      and conrelid = 'public.game_saves'::regclass
  ) then
    alter table public.game_saves
      add constraint game_saves_user_app_key_unique unique (user_id, app_id, save_key);
  end if;
exception when others then
  raise notice 'Could not add game_saves_user_app_key_unique: %', sqlerrm;
end $$;

create index if not exists idx_game_saves_user_app on public.game_saves (user_id, app_id, updated_at desc);

-- ─────────────────────────────────────────────────────────────
-- Friends / requests / blocks
-- ─────────────────────────────────────────────────────────────
create table if not exists public.friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_id <> friend_id)
);

alter table public.friends add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.friends add column if not exists friend_id uuid references auth.users(id) on delete cascade;
alter table public.friends add column if not exists created_at timestamptz default now();
update public.friends set created_at = now() where created_at is null;

delete from public.friends a
using public.friends b
where a.ctid < b.ctid and a.user_id = b.user_id and a.friend_id = b.friend_id;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'friends_user_friend_unique'
      and conrelid = 'public.friends'::regclass
  ) then
    alter table public.friends add constraint friends_user_friend_unique unique (user_id, friend_id);
  end if;
exception when others then
  raise notice 'Could not add friends_user_friend_unique: %', sqlerrm;
end $$;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

alter table public.friend_requests add column if not exists id uuid default gen_random_uuid();
alter table public.friend_requests add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.friend_requests add column if not exists receiver_id uuid references auth.users(id) on delete cascade;
alter table public.friend_requests add column if not exists status text default 'pending';
alter table public.friend_requests add column if not exists created_at timestamptz default now();
alter table public.friend_requests add column if not exists updated_at timestamptz default now();
update public.friend_requests set status = 'pending' where status is null;
update public.friend_requests set created_at = now() where created_at is null;
update public.friend_requests set updated_at = now() where updated_at is null;

delete from public.friend_requests a
using public.friend_requests b
where a.ctid < b.ctid and a.sender_id = b.sender_id and a.receiver_id = b.receiver_id;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'friend_requests_sender_receiver_unique'
      and conrelid = 'public.friend_requests'::regclass
  ) then
    alter table public.friend_requests add constraint friend_requests_sender_receiver_unique unique (sender_id, receiver_id);
  end if;
exception when others then
  raise notice 'Could not add friend_requests_sender_receiver_unique: %', sqlerrm;
end $$;

create table if not exists public.blocked_users (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id)
);

alter table public.blocked_users add column if not exists blocker_id uuid references auth.users(id) on delete cascade;
alter table public.blocked_users add column if not exists blocked_id uuid references auth.users(id) on delete cascade;
alter table public.blocked_users add column if not exists created_at timestamptz default now();

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks add column if not exists blocker_id uuid references auth.users(id) on delete cascade;
alter table public.user_blocks add column if not exists blocked_id uuid references auth.users(id) on delete cascade;
alter table public.user_blocks add column if not exists created_at timestamptz default now();

delete from public.blocked_users a using public.blocked_users b where a.ctid < b.ctid and a.blocker_id = b.blocker_id and a.blocked_id = b.blocked_id;
delete from public.user_blocks a using public.user_blocks b where a.ctid < b.ctid and a.blocker_id = b.blocker_id and a.blocked_id = b.blocked_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'blocked_users_unique' and conrelid = 'public.blocked_users'::regclass) then
    alter table public.blocked_users add constraint blocked_users_unique unique (blocker_id, blocked_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_blocks_unique' and conrelid = 'public.user_blocks'::regclass) then
    alter table public.user_blocks add constraint user_blocks_unique unique (blocker_id, blocked_id);
  end if;
exception when others then
  raise notice 'Could not add block unique constraints: %', sqlerrm;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Multiplayer rooms / room memberships
-- ─────────────────────────────────────────────────────────────
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  game_type text,
  host_id uuid references auth.users(id) on delete set null,
  player_x uuid references auth.users(id) on delete set null,
  player_o uuid references auth.users(id) on delete set null,
  player_x_name text,
  player_o_name text,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'waiting',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_rooms add column if not exists id uuid default gen_random_uuid();
alter table public.game_rooms add column if not exists room_code text;
alter table public.game_rooms add column if not exists game_type text;
alter table public.game_rooms add column if not exists host_id uuid references auth.users(id) on delete set null;
alter table public.game_rooms add column if not exists player_x uuid references auth.users(id) on delete set null;
alter table public.game_rooms add column if not exists player_o uuid references auth.users(id) on delete set null;
alter table public.game_rooms add column if not exists player_x_name text;
alter table public.game_rooms add column if not exists player_o_name text;
alter table public.game_rooms add column if not exists state jsonb default '{}'::jsonb;
alter table public.game_rooms add column if not exists status text default 'waiting';
alter table public.game_rooms add column if not exists is_public boolean default false;
alter table public.game_rooms add column if not exists created_at timestamptz default now();
alter table public.game_rooms add column if not exists updated_at timestamptz default now();

update public.game_rooms set room_code = upper(regexp_replace(coalesce(room_code, ''), '[^A-Za-z0-9]', '', 'g')) where room_code is not null;
update public.game_rooms set state = '{}'::jsonb where state is null;
update public.game_rooms set status = 'waiting' where status is null;
update public.game_rooms set is_public = false where is_public is null;
update public.game_rooms set created_at = now() where created_at is null;
update public.game_rooms set updated_at = now() where updated_at is null;

delete from public.game_rooms a
using public.game_rooms b
where a.ctid < b.ctid and a.room_code = b.room_code;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'game_rooms_room_code_unique' and conrelid = 'public.game_rooms'::regclass) then
    alter table public.game_rooms add constraint game_rooms_room_code_unique unique (room_code);
  end if;
exception when others then
  raise notice 'Could not add game_rooms_room_code_unique: %', sqlerrm;
end $$;

create index if not exists idx_game_rooms_room_code on public.game_rooms (room_code);
create index if not exists idx_game_rooms_host_status on public.game_rooms (host_id, status, updated_at desc);
create index if not exists idx_game_rooms_public_status on public.game_rooms (is_public, status, created_at desc);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.game_rooms(id) on delete cascade,
  room_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now()
);

alter table public.room_members add column if not exists id uuid default gen_random_uuid();
alter table public.room_members add column if not exists room_id uuid references public.game_rooms(id) on delete cascade;
alter table public.room_members add column if not exists room_code text;
alter table public.room_members add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.room_members add column if not exists role text default 'member';
alter table public.room_members add column if not exists joined_at timestamptz default now();
update public.room_members set room_code = upper(regexp_replace(coalesce(room_code, ''), '[^A-Za-z0-9]', '', 'g')) where room_code is not null;
update public.room_members set role = 'member' where role is null;
update public.room_members set joined_at = now() where joined_at is null;

-- Backfill room_id from room_code when possible.
update public.room_members rm
set room_id = gr.id
from public.game_rooms gr
where rm.room_id is null and rm.room_code = gr.room_code;

delete from public.room_members a
using public.room_members b
where a.ctid < b.ctid and a.room_code = b.room_code and a.user_id = b.user_id;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'room_members_room_user_unique' and conrelid = 'public.room_members'::regclass) then
    alter table public.room_members add constraint room_members_room_user_unique unique (room_code, user_id);
  end if;
exception when others then
  raise notice 'Could not add room_members_room_user_unique: %', sqlerrm;
end $$;

create index if not exists idx_room_members_user on public.room_members (user_id, joined_at desc);
create index if not exists idx_room_members_room_code on public.room_members (room_code);

-- ─────────────────────────────────────────────────────────────
-- Messages / chat fallbacks used by different GamerTabs screens
-- ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  room_code text,
  body text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.messages add column if not exists id uuid default gen_random_uuid();
alter table public.messages add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.messages add column if not exists recipient_id uuid references auth.users(id) on delete cascade;
alter table public.messages add column if not exists room_code text;
alter table public.messages add column if not exists body text;
alter table public.messages add column if not exists message text;
alter table public.messages add column if not exists created_at timestamptz default now();

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  body text,
  created_at timestamptz not null default now()
);

alter table public.direct_messages add column if not exists id uuid default gen_random_uuid();
alter table public.direct_messages add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.direct_messages add column if not exists receiver_id uuid references auth.users(id) on delete cascade;
alter table public.direct_messages add column if not exists body text;
alter table public.direct_messages add column if not exists created_at timestamptz default now();

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  room_code text not null,
  body text,
  created_at timestamptz not null default now()
);

alter table public.room_messages add column if not exists id uuid default gen_random_uuid();
alter table public.room_messages add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.room_messages add column if not exists room_code text;
alter table public.room_messages add column if not exists body text;
alter table public.room_messages add column if not exists created_at timestamptz default now();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);

alter table public.chat_messages add column if not exists id uuid default gen_random_uuid();
alter table public.chat_messages add column if not exists room_code text;
alter table public.chat_messages add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.chat_messages add column if not exists message text;
alter table public.chat_messages add column if not exists created_at timestamptz default now();

create index if not exists idx_messages_room on public.messages (room_code, created_at);
create index if not exists idx_messages_sender_recipient on public.messages (sender_id, recipient_id, created_at);
create index if not exists idx_direct_messages_pair on public.direct_messages (sender_id, receiver_id, created_at);
create index if not exists idx_room_messages_room on public.room_messages (room_code, created_at);
create index if not exists idx_chat_messages_room on public.chat_messages (room_code, created_at);

-- ─────────────────────────────────────────────────────────────
-- Nudges and match history
-- ─────────────────────────────────────────────────────────────
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid references auth.users(id) on delete cascade,
  game_id text not null,
  room_code text,
  message text,
  status text not null default 'unread',
  created_at timestamptz not null default now()
);

alter table public.nudges add column if not exists id uuid default gen_random_uuid();
alter table public.nudges add column if not exists from_user_id uuid references auth.users(id) on delete cascade;
alter table public.nudges add column if not exists to_user_id uuid references auth.users(id) on delete cascade;
alter table public.nudges add column if not exists game_id text;
alter table public.nudges add column if not exists room_code text;
alter table public.nudges add column if not exists message text;
alter table public.nudges add column if not exists status text default 'unread';
alter table public.nudges add column if not exists created_at timestamptz default now();
update public.nudges set status = 'unread' where status is null;

create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  result text not null,
  pts_earned integer not null default 0,
  bonuses text[],
  opponent_name text,
  mode text not null default 'online',
  room_code text,
  duration_secs integer,
  played_at timestamptz not null default now()
);

alter table public.match_history add column if not exists id uuid default gen_random_uuid();
alter table public.match_history add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.match_history add column if not exists game_id text;
alter table public.match_history add column if not exists result text;
alter table public.match_history add column if not exists pts_earned integer default 0;
alter table public.match_history add column if not exists bonuses text[];
alter table public.match_history add column if not exists opponent_name text;
alter table public.match_history add column if not exists mode text default 'online';
alter table public.match_history add column if not exists room_code text;
alter table public.match_history add column if not exists duration_secs integer;
alter table public.match_history add column if not exists played_at timestamptz default now();
update public.match_history set pts_earned = 0 where pts_earned is null;
update public.match_history set mode = 'online' where mode is null;
update public.match_history set played_at = now() where played_at is null;

-- ─────────────────────────────────────────────────────────────
-- Drop ALL old policies on app tables, then recreate secure policies.
-- This removes insecure demo-era/public policies.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'app_subscriptions','profiles','game_saves','friends','friend_requests','blocked_users','user_blocks',
        'game_rooms','room_members','messages','direct_messages','room_messages','chat_messages','nudges','match_history'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.app_subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.game_saves enable row level security;
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.blocked_users enable row level security;
alter table public.user_blocks enable row level security;
alter table public.game_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.direct_messages enable row level security;
alter table public.room_messages enable row level security;
alter table public.chat_messages enable row level security;
alter table public.nudges enable row level security;
alter table public.match_history enable row level security;

-- Subscription rows: client can read only own. No client insert/update/delete.
create policy "gamertabs_subscriptions_read_own"
  on public.app_subscriptions for select
  using (auth.uid() = user_id);

-- Profiles: users manage own. Paid users can discover opted-in profiles.
create policy "gamertabs_profiles_read_own_or_discoverable"
  on public.profiles for select
  using (auth.uid() = id or (auth.uid() is not null and public.has_gamertabs_full_access() and local_discovery_enabled = true));

create policy "gamertabs_profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "gamertabs_profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cloud saves: paid user owns all saves.
create policy "gamertabs_game_saves_manage_own_paid"
  on public.game_saves for all
  using (auth.uid() = user_id and app_id = 'gamertabs' and public.has_gamertabs_full_access())
  with check (auth.uid() = user_id and app_id = 'gamertabs' and public.has_gamertabs_full_access());

-- Friends/requests/blocks: paid feature, user-related only.
create policy "gamertabs_friends_read_related_paid"
  on public.friends for select
  using (public.has_gamertabs_full_access() and auth.uid() in (user_id, friend_id));

create policy "gamertabs_friends_insert_self_or_accepted_paid"
  on public.friends for insert
  with check (
    public.has_gamertabs_full_access()
    and (
      auth.uid() = user_id
      or exists (
        select 1 from public.friend_requests fr
        where fr.status = 'accepted'
          and ((fr.sender_id = user_id and fr.receiver_id = friend_id) or (fr.sender_id = friend_id and fr.receiver_id = user_id))
          and auth.uid() in (fr.sender_id, fr.receiver_id)
      )
    )
  );

create policy "gamertabs_friends_delete_related_paid"
  on public.friends for delete
  using (public.has_gamertabs_full_access() and auth.uid() in (user_id, friend_id));

create policy "gamertabs_friend_requests_read_related_paid"
  on public.friend_requests for select
  using (public.has_gamertabs_full_access() and auth.uid() in (sender_id, receiver_id));

create policy "gamertabs_friend_requests_send_paid"
  on public.friend_requests for insert
  with check (public.has_gamertabs_full_access() and auth.uid() = sender_id);

create policy "gamertabs_friend_requests_update_related_paid"
  on public.friend_requests for update
  using (public.has_gamertabs_full_access() and auth.uid() in (sender_id, receiver_id))
  with check (public.has_gamertabs_full_access() and auth.uid() in (sender_id, receiver_id));

create policy "gamertabs_blocks_manage_own_paid"
  on public.blocked_users for all
  using (public.has_gamertabs_full_access() and auth.uid() = blocker_id)
  with check (public.has_gamertabs_full_access() and auth.uid() = blocker_id);

create policy "gamertabs_user_blocks_manage_own_paid"
  on public.user_blocks for all
  using (public.has_gamertabs_full_access() and auth.uid() = blocker_id)
  with check (public.has_gamertabs_full_access() and auth.uid() = blocker_id);

-- Room helper condition is repeated as SQL because policies cannot call row-aware helpers easily.
create policy "gamertabs_rooms_read_paid_participants_or_public"
  on public.game_rooms for select
  using (
    public.has_gamertabs_full_access()
    and (
      is_public = true
      or auth.uid() in (host_id, player_x, player_o)
      or exists (select 1 from public.room_members rm where rm.room_code = game_rooms.room_code and rm.user_id = auth.uid())
    )
  );

create policy "gamertabs_rooms_create_paid_host"
  on public.game_rooms for insert
  with check (public.has_gamertabs_full_access() and auth.uid() in (host_id, player_x));

create policy "gamertabs_rooms_update_paid_participants"
  on public.game_rooms for update
  using (
    public.has_gamertabs_full_access()
    and (
      auth.uid() in (host_id, player_x, player_o)
      or exists (select 1 from public.room_members rm where rm.room_code = game_rooms.room_code and rm.user_id = auth.uid())
    )
  )
  with check (
    public.has_gamertabs_full_access()
    and (
      auth.uid() in (host_id, player_x, player_o)
      or exists (select 1 from public.room_members rm where rm.room_code = game_rooms.room_code and rm.user_id = auth.uid())
    )
  );

create policy "gamertabs_rooms_delete_paid_host"
  on public.game_rooms for delete
  using (public.has_gamertabs_full_access() and auth.uid() in (host_id, player_x));

create policy "gamertabs_room_members_read_paid_related"
  on public.room_members for select
  using (
    public.has_gamertabs_full_access()
    and (
      auth.uid() = user_id
      or exists (select 1 from public.room_members mine where mine.room_code = room_members.room_code and mine.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = room_members.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_room_members_insert_self_paid"
  on public.room_members for insert
  with check (public.has_gamertabs_full_access() and auth.uid() = user_id);

create policy "gamertabs_room_members_update_self_paid"
  on public.room_members for update
  using (public.has_gamertabs_full_access() and auth.uid() = user_id)
  with check (public.has_gamertabs_full_access() and auth.uid() = user_id);

create policy "gamertabs_room_members_delete_self_paid"
  on public.room_members for delete
  using (public.has_gamertabs_full_access() and auth.uid() = user_id);

-- Messages: direct messages only sender/receiver; room messages only room participants/members.
create policy "gamertabs_messages_read_related_paid"
  on public.messages for select
  using (
    public.has_gamertabs_full_access()
    and (
      auth.uid() in (sender_id, recipient_id)
      or exists (select 1 from public.room_members rm where rm.room_code = messages.room_code and rm.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = messages.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_messages_insert_self_paid"
  on public.messages for insert
  with check (
    public.has_gamertabs_full_access()
    and auth.uid() = sender_id
    and (
      recipient_id is not null
      or exists (select 1 from public.room_members rm where rm.room_code = messages.room_code and rm.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = messages.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_direct_messages_read_related_paid"
  on public.direct_messages for select
  using (public.has_gamertabs_full_access() and auth.uid() in (sender_id, receiver_id));

create policy "gamertabs_direct_messages_insert_self_paid"
  on public.direct_messages for insert
  with check (public.has_gamertabs_full_access() and auth.uid() = sender_id and receiver_id is not null);

create policy "gamertabs_room_messages_read_member_paid"
  on public.room_messages for select
  using (
    public.has_gamertabs_full_access()
    and (
      exists (select 1 from public.room_members rm where rm.room_code = room_messages.room_code and rm.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = room_messages.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_room_messages_insert_member_paid"
  on public.room_messages for insert
  with check (
    public.has_gamertabs_full_access()
    and auth.uid() = sender_id
    and (
      exists (select 1 from public.room_members rm where rm.room_code = room_messages.room_code and rm.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = room_messages.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_chat_messages_read_member_paid"
  on public.chat_messages for select
  using (
    public.has_gamertabs_full_access()
    and (
      exists (select 1 from public.room_members rm where rm.room_code = chat_messages.room_code and rm.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = chat_messages.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_chat_messages_insert_member_paid"
  on public.chat_messages for insert
  with check (
    public.has_gamertabs_full_access()
    and auth.uid() = user_id
    and (
      exists (select 1 from public.room_members rm where rm.room_code = chat_messages.room_code and rm.user_id = auth.uid())
      or exists (select 1 from public.game_rooms gr where gr.room_code = chat_messages.room_code and auth.uid() in (gr.host_id, gr.player_x, gr.player_o))
    )
  );

create policy "gamertabs_nudges_read_related_paid"
  on public.nudges for select
  using (public.has_gamertabs_full_access() and (auth.uid() in (from_user_id, to_user_id) or to_user_id is null));

create policy "gamertabs_nudges_insert_self_paid"
  on public.nudges for insert
  with check (public.has_gamertabs_full_access() and auth.uid() = from_user_id);

create policy "gamertabs_nudges_update_recipient_paid"
  on public.nudges for update
  using (public.has_gamertabs_full_access() and auth.uid() = to_user_id)
  with check (public.has_gamertabs_full_access() and auth.uid() = to_user_id);

create policy "gamertabs_match_history_manage_own_paid"
  on public.match_history for all
  using (public.has_gamertabs_full_access() and auth.uid() = user_id)
  with check (public.has_gamertabs_full_access() and auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────
drop trigger if exists gamertabs_profiles_updated_at on public.profiles;
create trigger gamertabs_profiles_updated_at
before update on public.profiles
for each row execute function public.gamertabs_touch_updated_at();

drop trigger if exists gamertabs_subscriptions_updated_at on public.app_subscriptions;
create trigger gamertabs_subscriptions_updated_at
before update on public.app_subscriptions
for each row execute function public.gamertabs_touch_updated_at();

drop trigger if exists gamertabs_game_saves_updated_at on public.game_saves;
create trigger gamertabs_game_saves_updated_at
before update on public.game_saves
for each row execute function public.gamertabs_touch_updated_at();

drop trigger if exists gamertabs_friend_requests_updated_at on public.friend_requests;
create trigger gamertabs_friend_requests_updated_at
before update on public.friend_requests
for each row execute function public.gamertabs_touch_updated_at();

drop trigger if exists gamertabs_rooms_updated_at on public.game_rooms;
create trigger gamertabs_rooms_updated_at
before update on public.game_rooms
for each row execute function public.gamertabs_touch_updated_at();

-- Profile auto-create on new signup. Uses a unique trigger name so it does not delete other app triggers.
create or replace function public.gamertabs_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'Player');

  insert into public.profiles (id, username, display_name)
  values (new.id, v_name, v_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_gamertabs on auth.users;
create trigger on_auth_user_created_gamertabs
after insert on auth.users
for each row execute function public.gamertabs_handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER RPCs used by GamerTabs room code.
-- These still enforce auth.uid() and paid access inside the function.
-- ─────────────────────────────────────────────────────────────
drop function if exists public.upsert_room_member_safe(text, text);
create function public.upsert_room_member_safe(p_room_code text, p_role text default 'member')
returns public.room_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_room_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_room public.game_rooms;
  v_member public.room_members;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_gamertabs_full_access() then raise exception 'Active GamerTabs subscription required'; end if;

  select * into v_room from public.game_rooms where room_code = v_code limit 1;
  if v_room.id is null then raise exception 'Room not found'; end if;

  insert into public.room_members (room_id, room_code, user_id, role)
  values (v_room.id, v_room.room_code, v_user, coalesce(p_role, 'member'))
  on conflict (room_code, user_id) do update set role = excluded.role
  returning * into v_member;

  return v_member;
end;
$$;

drop function if exists public.claim_room_seat_safe(text, text);
create function public.claim_room_seat_safe(p_room_code text, p_username text default null)
returns public.game_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_room_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_room public.game_rooms;
  v_state jsonb;
  v_slots jsonb;
  v_members jsonb;
  v_player_seats jsonb := '{}'::jsonb;
  v_open_ord integer;
  v_assigned_seat text;
  v_slot jsonb;
  v_slot_user text;
  v_name text := nullif(trim(coalesce(p_username, '')), '');
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_gamertabs_full_access() then raise exception 'Active GamerTabs subscription required'; end if;

  select * into v_room from public.game_rooms where room_code = v_code for update;
  if v_room.id is null then raise exception 'Room not found'; end if;
  if v_room.status in ('cancelled', 'closed', 'expired') then raise exception 'Room is closed'; end if;

  v_state := coalesce(v_room.state, '{}'::jsonb);
  v_slots := case
    when jsonb_typeof(v_state->'playerSlots') = 'array' and jsonb_array_length(v_state->'playerSlots') > 0
      then v_state->'playerSlots'
    else jsonb_build_array(
      jsonb_build_object('seat', 'X', 'kind', 'human', 'userId', coalesce(v_room.player_x::text, v_room.host_id::text, v_user::text), 'label', 'Host'),
      jsonb_build_object('seat', 'O', 'kind', 'open', 'userId', null, 'label', 'Open player')
    )
  end;

  select slot->>'seat'
    into v_assigned_seat
  from jsonb_array_elements(v_slots) as slots(slot)
  where slot->>'userId' = v_user::text
  limit 1;

  if v_assigned_seat is null then
    select ord
      into v_open_ord
    from jsonb_array_elements(v_slots) with ordinality as slots(slot, ord)
    where nullif(slots.slot->>'userId', '') is null
      and slots.slot->>'invitedUserId' = v_user::text
    order by ord
    limit 1;

    if v_open_ord is null then
      select ord
        into v_open_ord
      from jsonb_array_elements(v_slots) with ordinality as slots(slot, ord)
      where nullif(slots.slot->>'userId', '') is null
        and coalesce(slots.slot->>'kind', 'open') not in ('ai', 'local')
      order by ord
      limit 1;
    end if;

    if v_open_ord is null then
      raise exception 'No open online seat in this game';
    end if;

    select slot->>'seat'
      into v_assigned_seat
    from jsonb_array_elements(v_slots) with ordinality as slots(slot, ord)
    where ord = v_open_ord
    limit 1;

    v_slots := (
      select jsonb_agg(
        case when ord = v_open_ord
          then slot || jsonb_build_object(
            'seat', coalesce(v_assigned_seat, 'O'),
            'kind', 'human',
            'userId', v_user::text,
            'invitedUserId', null,
            'label', coalesce(v_name, 'Player')
          )
          else slot
        end
        order by ord
      )
      from jsonb_array_elements(v_slots) with ordinality as slots(slot, ord)
    );
  end if;

  for v_slot in select slot from jsonb_array_elements(v_slots) as slots(slot)
  loop
    v_slot_user := nullif(v_slot->>'userId', '');
    if v_slot_user is not null then
      v_player_seats := v_player_seats || jsonb_build_object(coalesce(v_slot->>'seat', 'X'), v_slot_user);
    end if;
  end loop;

  v_members := case when jsonb_typeof(v_state->'members') = 'array' then v_state->'members' else '[]'::jsonb end;
  if not (v_members ? v_user::text) then
    v_members := v_members || to_jsonb(v_user::text);
  end if;

  v_state := v_state || jsonb_build_object(
    'members', v_members,
    'playerSeats', v_player_seats,
    'playerSlots', v_slots,
    'lastJoinedAt', now()
  );

  update public.game_rooms
  set player_o = case when player_o is null and v_assigned_seat = 'O' then v_user else player_o end,
      player_o_name = case when player_o is null and v_assigned_seat = 'O' then coalesce(v_name, v_user::text) else player_o_name end,
      status = case when status in ('waiting', 'ready', 'open') and coalesce(v_assigned_seat, '') <> 'X' then 'active' else status end,
      state = v_state,
      updated_at = now()
  where id = v_room.id
  returning * into v_room;

  insert into public.room_members (room_id, room_code, user_id, role)
  values (v_room.id, v_room.room_code, v_user, case when v_user in (v_room.host_id, v_room.player_x) then 'host' else 'member' end)
  on conflict (room_code, user_id) do update set role = excluded.role;

  return v_room;
end;
$$;

drop function if exists public.join_room_by_code_safe(text);
create function public.join_room_by_code_safe(p_room_code text)
returns public.game_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_room_code,''), '[^A-Za-z0-9]', '', 'g'));
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if not public.has_gamertabs_full_access() then raise exception 'Active GamerTabs subscription required'; end if;

  return public.claim_room_seat_safe(v_code, null);
end;
$$;

drop function if exists public.join_random_match(text, text);
create function public.join_random_match(p_game_id text, p_username text default null)
returns public.game_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_game_id text := nullif(trim(coalesce(p_game_id, '')), '');
  v_room public.game_rooms;
  v_state jsonb;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if v_game_id is null then raise exception 'Game required'; end if;
  if not public.has_gamertabs_full_access() then raise exception 'Active GamerTabs subscription required'; end if;

  update public.game_rooms
  set status = 'cancelled', is_public = false, updated_at = now()
  where status in ('waiting', 'open')
    and is_public = true
    and state->>'roomKind' = 'random-match'
    and created_at < now() - interval '30 minutes';

  select *
    into v_room
  from public.game_rooms
  where game_type = v_game_id
    and is_public = true
    and status in ('waiting', 'open')
    and player_o is null
    and coalesce(state->>'roomKind', '') = 'random-match'
    and coalesce(host_id, player_x) <> v_user
  order by created_at asc
  for update skip locked
  limit 1;

  if v_room.id is null then
    return null;
  end if;

  v_room := public.claim_room_seat_safe(v_room.room_code, p_username);
  v_state := coalesce(v_room.state, '{}'::jsonb) || jsonb_build_object(
    'matchmaking',
    jsonb_build_object('status', 'matched', 'matchedAt', now(), 'matchedUserId', v_user::text)
  );

  update public.game_rooms
  set is_public = false,
      status = 'active',
      state = v_state,
      updated_at = now()
  where id = v_room.id
  returning * into v_room;

  return v_room;
end;
$$;

drop function if exists public.join_game_room(text, uuid, text);
create function public.join_game_room(p_room_code text, p_user_id uuid, p_username text default null)
returns public.game_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_room_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_room public.game_rooms;
  v_name text := nullif(trim(coalesce(p_username, '')), '');
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_user_id is not null and p_user_id <> v_user then raise exception 'Cannot join as another user'; end if;
  if not public.has_gamertabs_full_access() then raise exception 'Active GamerTabs subscription required'; end if;

  select * into v_room from public.game_rooms where room_code = v_code for update;
  if v_room.id is null then raise exception 'Room not found'; end if;

  if v_user in (v_room.host_id, v_room.player_x, v_room.player_o) then
    insert into public.room_members (room_id, room_code, user_id, role)
    values (v_room.id, v_room.room_code, v_user, case when v_user in (v_room.host_id, v_room.player_x) then 'host' else 'member' end)
    on conflict (room_code, user_id) do nothing;
    return public.claim_room_seat_safe(v_code, coalesce(v_name, v_user::text));
  end if;

  if v_room.player_o is not null then
    raise exception 'Room is full';
  end if;

  update public.game_rooms
  set player_o = v_user,
      player_o_name = coalesce(v_name, v_user::text),
      status = case when status in ('waiting','open') then 'ready' else status end,
      updated_at = now()
  where id = v_room.id
  returning * into v_room;

  insert into public.room_members (room_id, room_code, user_id, role)
  values (v_room.id, v_room.room_code, v_user, 'member')
  on conflict (room_code, user_id) do nothing;

  return public.claim_room_seat_safe(v_code, coalesce(v_name, v_user::text));
end;
$$;

drop function if exists public.leave_game_room(text, uuid);
create function public.leave_game_room(p_room_code text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_room_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_room public.game_rooms;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_user_id is not null and p_user_id <> v_user then raise exception 'Cannot leave as another user'; end if;

  select * into v_room from public.game_rooms where room_code = v_code for update;
  if v_room.id is null then return; end if;

  delete from public.room_members where room_code = v_code and user_id = v_user;

  if v_user = v_room.player_o then
    update public.game_rooms
    set player_o = null,
        player_o_name = null,
        status = case when status in ('ready','active') then 'waiting' else status end,
        updated_at = now()
    where id = v_room.id;
  elsif v_user in (v_room.host_id, v_room.player_x) then
    update public.game_rooms
    set status = 'cancelled', is_public = false, updated_at = now()
    where id = v_room.id;
  end if;
end;
$$;

drop function if exists public.close_room_safe(text);
create function public.close_room_safe(p_room_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_room_code,''), '[^A-Za-z0-9]', '', 'g'));
  v_count integer := 0;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  update public.game_rooms
  set status = 'cancelled', is_public = false, updated_at = now()
  where room_code = v_code
    and v_user in (host_id, player_x)
  returning 1 into v_count;

  return coalesce(v_count, 0);
end;
$$;

drop function if exists public.close_my_open_rooms_safe();
create function public.close_my_open_rooms_safe()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;

  with changed as (
    update public.game_rooms
    set status = 'cancelled', is_public = false, updated_at = now()
    where (host_id = v_user or player_x = v_user)
      and status in ('waiting','ready','open')
    returning 1
  )
  select count(*) into v_count from changed;

  return coalesce(v_count, 0);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Grants. RLS still decides what authenticated users can do.
-- Service role bypasses RLS for Stripe webhook/API admin writes.
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on public.app_subscriptions to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.game_saves to authenticated;
grant select, insert, update, delete on public.friends to authenticated;
grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert, update, delete on public.blocked_users to authenticated;
grant select, insert, update, delete on public.user_blocks to authenticated;
grant select, insert, update, delete on public.game_rooms to authenticated;
grant select, insert, update, delete on public.room_members to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.direct_messages to authenticated;
grant select, insert, update, delete on public.room_messages to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
grant select, insert, update, delete on public.nudges to authenticated;
grant select, insert, update, delete on public.match_history to authenticated;

grant execute on function public.has_gamertabs_full_access() to authenticated;
grant execute on function public.upsert_room_member_safe(text, text) to authenticated;
grant execute on function public.claim_room_seat_safe(text, text) to authenticated;
grant execute on function public.join_room_by_code_safe(text) to authenticated;
grant execute on function public.join_random_match(text, text) to authenticated;
grant execute on function public.join_game_room(text, uuid, text) to authenticated;
grant execute on function public.leave_game_room(text, uuid) to authenticated;
grant execute on function public.close_room_safe(text) to authenticated;
grant execute on function public.close_my_open_rooms_safe() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Realtime publication setup. Non-critical; failures are safe to ignore.
-- ─────────────────────────────────────────────────────────────
do $$
begin
  begin alter publication supabase_realtime add table public.game_rooms; exception when others then null; end;
  begin alter publication supabase_realtime add table public.room_members; exception when others then null; end;
  begin alter publication supabase_realtime add table public.nudges; exception when others then null; end;
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.room_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.chat_messages; exception when others then null; end;
end $$;

-- Done.
