alter table notifications
drop constraint notifications_user_id_fkey,
add constraint notifications_user_id_fkey foreign key (user_id) references profiles(id);

alter table user_alerts
drop constraint user_alerts_user_id_fkey,
add constraint user_alerts_user_id_fkey foreign key (user_id) references profiles(id);