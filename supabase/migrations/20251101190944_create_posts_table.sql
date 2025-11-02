do $$ begin
  create type public.post_type as enum ('lost','found');
exception when duplicate_object then null; 
end $$;

do $$ begin
  create type public.post_status as enum ('open','pending_claim','claimed');
exception when duplicate_object then null; 
end $$;

do $$ begin
  create type public.post_item_category as enum ('electronic','stationery','book','clothing');
exception when duplicate_object then null; 
end $$;

create table if not exists public.posts (
  id                uuid                        default gen_random_uuid() primary key,
  user_id           uuid                        references public.profiles(id) on delete cascade,
  item_name         text                        not null,
  description       text,
  post_type         public.post_type            not null,
  item_category     public.post_item_category   not null,
  location_name     text,
  image_path        text[],
  post_status       public.post_status          default 'open',
  search            tsvector,
  created_at        timestamptz                 not null default now(),
  updated_at        timestamptz                 not null default now(),
  constraint posts_item_name_nonempty check (length(btrim(item_name)) > 0)
);

-- updated_at trigger
drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function extensions.moddatetime(updated_at);

-- Full-text search: trigger to keep 'search' in sync
create or replace function public.posts_tsvector_update()
returns trigger
language plpgsql
as $$
begin
  new.search :=
    setweight(to_tsvector('simple',  coalesce(new.item_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end
$$;

drop trigger if exists posts_search_tg on public.posts;
create trigger posts_search_tg
before insert or update on public.posts
for each row execute function public.posts_tsvector_update();

-- Helpful indexes for filters + recency + search
create index if not exists idx_posts_filter
  on public.posts (post_type, post_status, item_category, created_at desc);

create index if not exists idx_posts_user
  on public.posts (user_id);

create index if not exists idx_posts_status_created
  on public.posts (post_status, created_at desc);

create index if not exists idx_posts_search
  on public.posts using gin (search);


-- RLS
alter table public.posts enable row level security;

do $$ begin
  create policy "posts_read_all"
    on public.posts for select using (true);

  create policy "posts_insert_self"
    on public.posts for insert
    with check (auth.uid() = user_id);

  create policy "posts_update_own"
    on public.posts for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create policy "posts_delete_own"
    on public.posts for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;