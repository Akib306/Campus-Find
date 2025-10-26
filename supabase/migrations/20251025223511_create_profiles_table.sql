create extension if not exists citext;
create extension if not exists moddatetime;

create table if not exists public.profiles (
  id uuid     primary key references auth.users(id) on delete cascade,
  username    text,
  email       citext not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at fresh
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function extensions.moddatetime(updated_at);

-- RLS
alter table public.profiles enable row level security;

do $$ begin
  create policy "profiles_read_all"
    on public.profiles for select
    using (true);

  create policy "profiles_insert_self"
    on public.profiles for insert
    with check (auth.uid() = id);

  create policy "profiles_update_self"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Prevent clients from changing email
revoke update (email) on table public.profiles from anon, authenticated;

-- Auto-create a profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict do nothing;
  return new;
end $$;

-- Trigger for new user function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();