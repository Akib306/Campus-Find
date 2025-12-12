-- Refactor "new user" logic
-- A user is considered "new" only if they joined < 24 hours ago.

create or replace view public.user_reliability_stats as
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
  (prof.created_at > now() - interval '24 hours') as is_new_user
from public.profiles prof
left join posts_count  pc on pc.user_id = prof.id
left join helpful_posts hp on hp.user_id = prof.id
left join votes_received vr on vr.user_id = prof.id
left join votes_cast    vc on vc.user_id = prof.id;

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

-- Keep views as SECURITY INVOKER so base-table RLS applies to the caller
alter view public.user_reliability_stats
  set (security_invoker = true);

alter view public.profiles_with_reliability
  set (security_invoker = true);

-- Ensure privileges match the rest of the app
do $$ begin
  revoke all on table public.user_reliability_stats from public;
  revoke all on table public.profiles_with_reliability from public;
exception when undefined_object then null;
end $$;

do $$ begin
  grant select on table public.user_reliability_stats to authenticated;
  grant select on table public.profiles_with_reliability to authenticated;
exception when undefined_object then null;
end $$;
