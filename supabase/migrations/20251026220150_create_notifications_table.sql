-- Create the notifications table
create table if not exists public.notifications (
    id uuid     default gen_random_uuid() primary key,          -- Unique notification ID, for each unique notification to a user
    user_id     uuid references auth.users(id) not null,        -- ID of the user receiving the notification
    message     text not null,                                  -- Notification message content
    type        text default 'in_app',                          -- Type of notification: 'in_app', 'email', or 'both' (defaults to 'in_app')
    link        text,                                           -- Deep link to the relevant listing, depending on the notification type
    is_read     boolean default false,                          -- Flag to indicate if the notification has been read
    created_at  timestamptz not null default now()              -- Timestamp when the notification was created
);

-- Enable full replica identity for realtime DELETE events
alter table notifications replica identity full;

-- Enables realtime on notifications table
alter publication supabase_realtime add table public.notifications;

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