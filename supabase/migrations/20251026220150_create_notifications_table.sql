-- Create the notifications table
create table if not exists public.notifications (
    id uuid     default gen_random_uuid() primary key,          -- Unique notification ID, for each unique notification to a user
    user_id     uuid references auth.users(id) not null,        -- ID of the user receiving the notification
    message     text not null,                                  -- Notification message content
    type        text not null,                                  -- Type of notification: 'in_app', 'email', or 'both'
    link        text,                                           -- Deep link to the relevant listing, depending on the notification type
    is_read     boolean default false,                          -- Flag to indicate if the notification has been read
    created_at  timestamp with time zone default now() not null -- Timestamp when the notification was created
);

