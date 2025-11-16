-- Drop existing foreign keys to auth.users
alter table notifications
drop constraint if exists notifications_user_id_fkey;

alter table user_alerts
drop constraint if exists user_alerts_user_id_fkey;

-- Add foreign keys to profiles.id instead
alter table notifications
add constraint notifications_user_id_fkey
foreign key (user_id)
references profiles(id)
on delete cascade;

alter table user_alerts
add constraint user_alerts_user_id_fkey
foreign key (user_id)
references profiles(id)
on delete cascade;
