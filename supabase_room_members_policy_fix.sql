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
