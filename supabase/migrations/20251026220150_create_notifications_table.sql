-- Create the notifications table
create table if not exists public.notifications (
    id uuid     default gen_random_uuid() primary key,          -- Unique notification ID, for each unique notification to a user
    user_id     uuid references auth.users(id) not null,        -- ID of the user receiving the notification
    message     text not null,                                  -- Notification message content
    type        text not null,                                  -- Type of notification: 'in_app', 'email', or 'both'
    link        text,                                           -- Deep link to the relevant listing, depending on the notification type
    is_read     boolean default false,                          -- Flag to indicate if the notification has been read
    created_at  timestamptz not null default now()              -- Timestamp when the notification was created
);

-- RLS
alter table notifications enable row level security;

-- Policy: System can create notifications
create policy "sys_create_notifications"
    on notifications
    for insert
    with check (true);

-- Policy: Users can only see their own notifications
create policy "users_see_own_notifications"
    on notifications 
    for select using ( (select auth.uid()) = user_id );

-- Policy: Users can mark their own notifications as read
create policy "users_update_own_notifications"
    on notifications
    for update using ( (select auth.uid()) = user_id )
    with check ( (select auth.uid()) = user_id ); -- Ensure that users can only update their own notifications

-- Policy: Authenticated users can receive broadcasts
create policy "Authenticated users can receive broadcasts"
    on "realtime"."messages"
    for select
    to authenticated
    using ( true );

-- Function to broadcast notification changes
create or replace function public.notifications_changes()
returns trigger
security definer
language plpgsql
as $$
begin
    perform realtime.broadcast_changes(
        'notifications:' || coalesce(NEW.user_id, OLD.user_id)::text,
        TG_OP,
        TG_OP,
        TG_TABLE_NAME,
        TG_TABLE_SCHEMA,
        NEW,
        OLD
    );
    return coalesce(NEW, OLD);
end;
$$;

-- Trigger to call the function on notifications table changes
drop trigger if exists handle_notifications_changes on public.notifications;
create trigger handle_notifications_changes
after insert or update or delete
on public.notifications
for each row
execute function public.notifications_changes();