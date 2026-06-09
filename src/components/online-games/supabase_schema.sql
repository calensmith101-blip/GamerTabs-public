-- ============================================================
-- GamerTab: Black Vault — Complete Supabase SQL
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
create table if not exists profiles (
  id         uuid references auth.users on delete cascade primary key,
  username   text,
  avatar_url text,
  points     integer not null default 0,
  crowns     integer not null default 0,
  level      integer not null default 1,
  wins       integer not null default 0,
  losses     integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Public profiles readable"
  on profiles for select using (true);

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users delete own profile"
  on profiles for delete using (auth.uid() = id);

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

-- ─── GAME_ROOMS ──────────────────────────────────────────────
-- Add any missing columns to existing table (safe to run multiple times)
alter table game_rooms add column if not exists game_type  text;
alter table game_rooms add column if not exists room_code  text unique;
alter table game_rooms add column if not exists player_x   uuid references auth.users;
alter table game_rooms add column if not exists player_o   uuid references auth.users;
alter table game_rooms add column if not exists state      jsonb not null default '{}'::jsonb;
alter table game_rooms add column if not exists status     text not null default 'waiting';
alter table game_rooms add column if not exists created_at timestamptz not null default now();
alter table game_rooms add column if not exists updated_at timestamptz not null default now();

alter table game_rooms enable row level security;

drop policy if exists "Anyone can read rooms"   on game_rooms;
drop policy if exists "Authed users create"     on game_rooms;
drop policy if exists "Players update their room" on game_rooms;

create policy "Anyone can read rooms"
  on game_rooms for select using (true);

create policy "Authed users create rooms"
  on game_rooms for insert with check (auth.uid() = player_x);

create policy "Players can update their room"
  on game_rooms for update
  using (auth.uid() = player_x or auth.uid() = player_o);

create trigger game_rooms_updated_at
  before update on game_rooms
  for each row execute procedure handle_updated_at();

-- Enable Supabase Realtime for game_rooms
alter publication supabase_realtime add table game_rooms;

-- ─── NUDGES ──────────────────────────────────────────────────
create table if not exists nudges (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users on delete cascade not null,
  to_user_id   uuid references auth.users on delete cascade,  -- null = broadcast
  game_id      text not null,
  room_code    text,
  message      text,
  status       text not null default 'unread'
                   check (status in ('unread','read','accepted','declined')),
  created_at   timestamptz not null default now()
);

alter table nudges enable row level security;

create policy "Users read nudges sent to them or broadcast"
  on nudges for select
  using (
    auth.uid() = from_user_id
    or auth.uid() = to_user_id
    or to_user_id is null
  );

create policy "Authed users send nudges"
  on nudges for insert with check (auth.uid() = from_user_id);

create policy "Recipient updates nudge status"
  on nudges for update
  using (
    auth.uid() = to_user_id
    or (to_user_id is null and auth.uid() is not null)
  );

-- Enable realtime for nudges
alter publication supabase_realtime add table nudges;

-- ─── MATCH_HISTORY ───────────────────────────────────────────
create table if not exists match_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  game_id       text not null,
  result        text not null check (result in ('win','loss','draw')),
  pts_earned    integer not null default 0,
  bonuses       text[],
  opponent_name text,
  mode          text not null default 'online',
  room_code     text,
  duration_secs integer,
  played_at     timestamptz not null default now()
);

alter table match_history enable row level security;

create policy "Users read own match history"
  on match_history for select using (auth.uid() = user_id);

create policy "Users insert own match history"
  on match_history for insert with check (auth.uid() = user_id);

-- ─── HELPER: auto-create profile on sign-up ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
