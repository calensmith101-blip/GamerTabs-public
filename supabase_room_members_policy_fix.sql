-- Fix: "infinite recursion detected in policy for relation room_members"
-- Run this once in Supabase SQL Editor.
--
-- The old policies likely query room_members from inside a room_members
-- policy. PostgreSQL recurses forever in that shape. These replacement
-- policies never reference room_members inside their own USING clauses.

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists town text;
alter table public.profiles add column if not exists suburb text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists is_online boolean not null default false;
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists local_discovery_enabled boolean not null default false;

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (room_code, user_id)
);

alter table public.room_members enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select pol.polname
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'room_members'
  loop
    execute format('drop policy if exists %I on public.room_members', policy_name);
  end loop;
end $$;

create policy "room_members_select_own"
  on public.room_members
  for select
  using (auth.uid() = user_id);

create policy "room_members_insert_self"
  on public.room_members
  for insert
  with check (auth.uid() = user_id);

create policy "room_members_update_self"
  on public.room_members
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "room_members_delete_self"
  on public.room_members
  for delete
  using (auth.uid() = user_id);

create or replace function public.upsert_room_member_safe(
  p_room_code text,
  p_role text default 'member'
)
returns public.room_members
language plpgsql
security definer
set search_path = public
as $$
declare
  row_out public.room_members;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.room_members (room_code, user_id, role)
  values (upper(regexp_replace(coalesce(p_room_code, ''), '[^A-Za-z0-9]', '', 'g')), auth.uid(), coalesce(p_role, 'member'))
  on conflict (room_code, user_id)
  do update set role = excluded.role
  returning * into row_out;

  return row_out;
end;
$$;

grant execute on function public.upsert_room_member_safe(text, text) to authenticated;

-- Extra multiplayer/social repair used by the current app flow.
-- Safe to run repeatedly. It does not drop tables, truncate, or delete history.

alter table public.game_rooms add column if not exists host_id uuid references auth.users(id) on delete set null;
alter table public.game_rooms add column if not exists player_x uuid references auth.users(id) on delete set null;
alter table public.game_rooms add column if not exists player_o uuid references auth.users(id) on delete set null;
alter table public.game_rooms add column if not exists player_x_name text;
alter table public.game_rooms add column if not exists player_o_name text;
alter table public.game_rooms add column if not exists game_type text;
alter table public.game_rooms add column if not exists room_code text;
alter table public.game_rooms add column if not exists status text not null default 'waiting';
alter table public.game_rooms add column if not exists is_public boolean not null default false;
alter table public.game_rooms add column if not exists state jsonb not null default '{}'::jsonb;
alter table public.game_rooms add column if not exists created_at timestamptz not null default now();
alter table public.game_rooms add column if not exists updated_at timestamptz not null default now();

create unique index if not exists game_rooms_room_code_key on public.game_rooms (room_code);

alter table public.game_rooms enable row level security;

drop policy if exists "game_rooms_select_live" on public.game_rooms;
drop policy if exists "game_rooms_insert_host" on public.game_rooms;
drop policy if exists "game_rooms_update_participants" on public.game_rooms;

create policy "game_rooms_select_live"
  on public.game_rooms
  for select
  using (
    is_public
    or auth.uid() = host_id
    or auth.uid() = player_x
    or auth.uid() = player_o
    or exists (
      select 1 from public.room_members rm
      where rm.room_code = game_rooms.room_code
        and rm.user_id = auth.uid()
    )
    or state->>'invitedUserId' = auth.uid()::text
    or coalesce(state->'invitedUserIds', '[]'::jsonb) ? auth.uid()::text
  );

create policy "game_rooms_insert_host"
  on public.game_rooms
  for insert
  with check (auth.uid() = host_id or auth.uid() = player_x);

create policy "game_rooms_update_participants"
  on public.game_rooms
  for update
  using (
    auth.uid() = host_id
    or auth.uid() = player_x
    or auth.uid() = player_o
    or exists (
      select 1 from public.room_members rm
      where rm.room_code = game_rooms.room_code
        and rm.user_id = auth.uid()
    )
    or state->>'invitedUserId' = auth.uid()::text
    or coalesce(state->'invitedUserIds', '[]'::jsonb) ? auth.uid()::text
  )
  with check (
    auth.uid() = host_id
    or auth.uid() = player_x
    or auth.uid() = player_o
    or exists (
      select 1 from public.room_members rm
      where rm.room_code = game_rooms.room_code
        and rm.user_id = auth.uid()
    )
    or state->>'invitedUserId' = auth.uid()::text
    or coalesce(state->'invitedUserIds', '[]'::jsonb) ? auth.uid()::text
  );

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.direct_messages enable row level security;
alter table public.room_messages enable row level security;
alter table public.blocked_users enable row level security;

drop policy if exists "friends_own_rows" on public.friends;
drop policy if exists "friend_requests_participants" on public.friend_requests;
drop policy if exists "direct_messages_participants" on public.direct_messages;
drop policy if exists "room_messages_members" on public.room_messages;
drop policy if exists "blocked_users_own_rows" on public.blocked_users;

create policy "friends_own_rows" on public.friends
  for all
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id);

create policy "friend_requests_participants" on public.friend_requests
  for all
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "direct_messages_participants" on public.direct_messages
  for all
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id);

create policy "room_messages_members" on public.room_messages
  for all
  using (
    auth.uid() = sender_id
    or exists (
      select 1 from public.room_members rm
      where rm.room_code = room_messages.room_code
        and rm.user_id = auth.uid()
    )
  )
  with check (auth.uid() = sender_id);

create policy "blocked_users_own_rows" on public.blocked_users
  for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

create or replace function public.close_my_open_rooms_safe()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  closed_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.game_rooms
  set status = 'cancelled',
      is_public = false,
      updated_at = now(),
      state = coalesce(state, '{}'::jsonb) || jsonb_build_object('closedAt', now(), 'closedBy', auth.uid())
  where host_id = auth.uid()
    and status in ('waiting', 'ready', 'open');

  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;

grant execute on function public.close_my_open_rooms_safe() to authenticated;

create or replace function public.close_room_safe(p_room_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_code text := upper(regexp_replace(coalesce(p_room_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.game_rooms
  set status = 'cancelled',
      is_public = false,
      updated_at = now(),
      state = coalesce(state, '{}'::jsonb) || jsonb_build_object('closedAt', now(), 'closedBy', auth.uid())
  where room_code = clean_code
    and (host_id = auth.uid() or player_x = auth.uid());

  return found;
end;
$$;

grant execute on function public.close_room_safe(text) to authenticated;

create or replace function public.join_room_by_code_safe(p_room_code text)
returns public.game_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_code text := upper(regexp_replace(coalesce(p_room_code, ''), '[^A-Za-z0-9]', '', 'g'));
  room_row public.game_rooms;
  previous_state jsonb;
  slots jsonb;
  next_slots jsonb := '[]'::jsonb;
  slot jsonb;
  seat_text text;
  player_seats jsonb := '{}'::jsonb;
  members jsonb;
  i integer := 0;
  chosen_index integer := -1;
  seat_ids text[] := array['X','O','P3','P4','P5'];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into room_row
  from public.game_rooms
  where room_code = clean_code
  limit 1;

  if not found then
    raise exception 'Room not found';
  end if;

  previous_state := coalesce(room_row.state, '{}'::jsonb);
  slots := coalesce(previous_state->'playerSlots', '[]'::jsonb);

  if jsonb_array_length(slots) = 0 then
    slots := jsonb_build_array(
      jsonb_build_object('seat', 'X', 'kind', 'human', 'userId', coalesce(room_row.player_x::text, room_row.host_id::text)),
      jsonb_build_object('seat', 'O', 'kind', 'open', 'userId', null)
    );
  end if;

  for i in 0..jsonb_array_length(slots)-1 loop
    slot := slots->i;
    if slot->>'userId' = auth.uid()::text then
      chosen_index := i;
    end if;
  end loop;

  if chosen_index = -1 then
    for i in 0..jsonb_array_length(slots)-1 loop
      slot := slots->i;
      if coalesce(slot->>'userId', '') = ''
         and slot->>'invitedUserId' = auth.uid()::text then
        chosen_index := i;
        exit;
      end if;
    end loop;
  end if;

  if chosen_index = -1 then
    for i in 0..jsonb_array_length(slots)-1 loop
      slot := slots->i;
      if coalesce(slot->>'userId', '') = ''
         and coalesce(slot->>'kind', 'open') not in ('ai', 'local') then
        chosen_index := i;
        exit;
      end if;
    end loop;
  end if;

  if chosen_index = -1 then
    raise exception 'No open online seat in this game';
  end if;

  for i in 0..jsonb_array_length(slots)-1 loop
    slot := slots->i;
    if i = chosen_index then
      slot := slot || jsonb_build_object('kind', 'human', 'userId', auth.uid()::text, 'invitedUserId', null);
    end if;
    next_slots := next_slots || jsonb_build_array(slot);
    if coalesce(slot->>'userId', '') <> '' then
      seat_text := coalesce(slot->>'seat', seat_ids[least(i + 1, array_length(seat_ids, 1))]);
      player_seats := player_seats || jsonb_build_object(seat_text, slot->>'userId');
    end if;
  end loop;

  members := coalesce(previous_state->'members', '[]'::jsonb);
  if not members ? auth.uid()::text then
    members := members || to_jsonb(auth.uid()::text);
  end if;

  insert into public.room_members (room_code, user_id, role)
  values (clean_code, auth.uid(), case when room_row.host_id = auth.uid() or room_row.player_x = auth.uid() then 'host' else 'member' end)
  on conflict (room_code, user_id)
  do update set role = excluded.role;

  update public.game_rooms
  set player_o = case
        when player_o is null
         and exists (
           select 1 from jsonb_array_elements(next_slots) s
           where s->>'seat' = 'O' and s->>'userId' = auth.uid()::text
         )
        then auth.uid()
        else player_o
      end,
      player_o_name = case
        when player_o_name is null
         and exists (
           select 1 from jsonb_array_elements(next_slots) s
           where s->>'seat' = 'O' and s->>'userId' = auth.uid()::text
         )
        then auth.uid()::text
        else player_o_name
      end,
      status = case when status in ('expired', 'cancelled', 'closed') then 'open' else status end,
      state = previous_state || jsonb_build_object(
        'members', members,
        'playerSlots', next_slots,
        'playerSeats', player_seats,
        'lastJoinedAt', now()
      ),
      updated_at = now()
  where room_code = clean_code
  returning * into room_row;

  return room_row;
end;
$$;

grant execute on function public.join_room_by_code_safe(text) to authenticated;

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

alter table public.nudges enable row level security;

drop policy if exists "nudges_participant_read" on public.nudges;
drop policy if exists "nudges_sender_insert" on public.nudges;
drop policy if exists "nudges_recipient_update" on public.nudges;

create policy "nudges_participant_read"
  on public.nudges
  for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id or to_user_id is null);

create policy "nudges_sender_insert"
  on public.nudges
  for insert
  with check (auth.uid() = from_user_id);

create policy "nudges_recipient_update"
  on public.nudges
  for update
  using (auth.uid() = to_user_id or auth.uid() = from_user_id or (to_user_id is null and auth.uid() is not null))
  with check (auth.uid() = to_user_id or auth.uid() = from_user_id or (to_user_id is null and auth.uid() is not null));

do $$
begin
  alter publication supabase_realtime add table public.game_rooms;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.nudges;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
