-- Create the user_alerts table
create table if not exists public.user_alerts (
    id uuid     default gen_random_uuid() primary key,          -- Unique alert ID for each user alert
    user_id     uuid references auth.users(id) not null,        -- ID of the user setting the alert
    keywords    text[] not null,                                -- Array of keywords the user wants to be alerted about
    categories  text,
    created_at  timestamptz not null default now()              -- Timestamp when the alert was created
);

-- RLS
alter table user_alerts enable row level security;

-- Policy: Users can manage their own alerts
create policy "users_manage_own_alerts"
    on user_alerts
    for all
    using ( (select auth.uid()) = user_id )
    with check ( (select auth.uid()) = user_id );