create table if not exists public.post_helpfulness_votes (
  post_id   uuid not null references public.posts(id) on delete cascade,
  voter_id  uuid not null references public.profiles(id) on delete cascade,
  is_helpful boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_helpfulness_votes_pkey primary key (post_id, voter_id)
);

-- keep updated_at fresh
drop trigger if exists set_phv_updated_at on public.post_helpfulness_votes;
create trigger set_phv_updated_at
before update on public.post_helpfulness_votes
for each row execute function extensions.moddatetime(updated_at);

-- helpful indexes
create index if not exists idx_phv_voter on public.post_helpfulness_votes (voter_id);
create index if not exists idx_phv_post on public.post_helpfulness_votes (post_id);
create index if not exists idx_phv_post_helpful_true
  on public.post_helpfulness_votes (post_id)
  where is_helpful is true;

-- RLS
alter table public.post_helpfulness_votes enable row level security;

do $$ begin
  create policy "phv_read_all"
    on public.post_helpfulness_votes for select
    using (true);

  -- one row per (post_id, voter_id) enforced by PK
  -- prevent self-vote: voter cannot be the author of the target post
  create policy "phv_insert_self_not_self_target"
    on public.post_helpfulness_votes for insert
    with check (
      auth.uid() = voter_id
      and not exists (
        select 1
        from public.posts p
        where p.id = post_id
          and p.user_id = auth.uid()
      )
    );

  -- allow toggling is_helpful by the voter; still forbid self-target on update
  create policy "phv_update_own"
    on public.post_helpfulness_votes for update
    using (auth.uid() = voter_id)
    with check (
      auth.uid() = voter_id
      and not exists (
        select 1
        from public.posts p
        where p.id = post_id
          and p.user_id = auth.uid()
      )
    );

  -- allow a voter to remove their own vote
  create policy "phv_delete_own"
    on public.post_helpfulness_votes for delete
    using (auth.uid() = voter_id);
exception when duplicate_object then null; end $$;

-- Per-user reliability stats view
-- - helpful_posts: count of DISTINCT posts authored by the user that have at least one is_helpful=true vote
-- - total_posts: authored posts
-- - total_votes_received: all votes (true/false) on their posts
-- - votes_cast: votes the user has cast
-- - is_new_user: true if no posts and no votes cast
do $$ begin
  create view public.user_reliability_stats as
  with posts_count as (
    select user_id, count(*) as cnt
    from public.posts
    group by user_id
  ),
  helpful_posts as (
    select p.user_id, count(distinct v.post_id) as cnt
    from public.post_helpfulness_votes v
    join public.posts p on p.id = v.post_id
    where v.is_helpful is true
    group by p.user_id
  ),
  votes_received as (
    select p.user_id, count(*) as cnt
    from public.post_helpfulness_votes v
    join public.posts p on p.id = v.post_id
    group by p.user_id
  ),
  votes_cast as (
    select voter_id as user_id, count(*) as cnt
    from public.post_helpfulness_votes
    group by voter_id
  )
  select
    prof.id as user_id,
    coalesce(pc.cnt, 0)  as total_posts,
    coalesce(hp.cnt, 0)  as helpful_posts,
    coalesce(vr.cnt, 0)  as total_votes_received,
    coalesce(vc.cnt, 0)  as votes_cast,
    case when coalesce(pc.cnt,0) = 0 and coalesce(vc.cnt,0) = 0 then true else false end as is_new_user
  from public.profiles prof
  left join posts_count  pc on pc.user_id = prof.id
  left join helpful_posts hp on hp.user_id = prof.id
  left join votes_received vr on vr.user_id = prof.id
  left join votes_cast    vc on vc.user_id = prof.id;
exception when duplicate_object then null; end $$;

-- Convenience view: profiles + reliability fields together
create or replace view public.profiles_with_reliability as
select
  p.*,
  s.total_posts,
  s.helpful_posts,
  s.total_votes_received,
  s.votes_cast,
  s.is_new_user
from public.profiles p
left join public.user_reliability_stats s on s.user_id = p.id;