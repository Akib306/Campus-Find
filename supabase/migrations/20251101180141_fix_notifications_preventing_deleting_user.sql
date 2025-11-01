begin;

-- notifications → profiles with cascades
alter table if exists public.notifications
  drop constraint if exists notifications_user_id_fkey;

alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.profiles(id)
  on delete cascade
  on update cascade;

create index if not exists idx_notifications_user_id
  on public.notifications(user_id);

-- user_alerts → profiles with cascades
alter table if exists public.user_alerts
  drop constraint if exists user_alerts_user_id_fkey;

alter table public.user_alerts
  add constraint user_alerts_user_id_fkey
  foreign key (user_id) references public.profiles(id)
  on delete cascade
  on update cascade;

create index if not exists idx_user_alerts_user_id
  on public.user_alerts(user_id);

commit;
