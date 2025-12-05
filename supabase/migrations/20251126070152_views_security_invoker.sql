-- Switch views to SECURITY INVOKER so base-table RLS applies to the caller
alter view if exists public.user_reliability_stats
  set (security_invoker = true);

alter view if exists public.profiles_with_reliability
  set (security_invoker = true);

-- Tighten privileges: remove implicit PUBLIC access, grant to authenticated only
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