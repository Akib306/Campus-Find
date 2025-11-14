-- Function to create notifications when posts match user alerts
create or replace function notify_matching_alerts()
returns trigger as $$
DECLARE
    alert_record record;
    keyword text;
    matches boolean;
BEGIN
    -- Loop through all active alerts
    for alert_record in
        select id, user_id, categories, keywords
        from user_alerts
    Loop
        
        matches := false;

        -- Check if category matches
        if NEW.item_category = alert_record.categories THEN
            matches := true;
        end if;

        -- Check if any keyword matches
        if alert_record.keywords is not null THEN
            foreach keyword in array alert.record.keywords
            Loop
                if NEW.item_name ILIKE '%' || keyword || '%' THEN  -- Case-insensitive pattern matching
                    matches := true;
                    exit;
                end if;
            end loop;
        end if;

    -- If a match was found, create a notification
    -- Check if the match is not directed to the same user
    if matches and alert_record.user_id != NEW.user_id THEN
        insert into notifications (user_id, message, type, link)
        values (
            alert_record.user_id,
            'New post matching your alert: ' || NEW.item_name,
            'in_app',
            '/posts/' || NEW.id
        );
        end if;
    end loop;
    return new;
END;
$$ language plpgsql;

-- Trigger to call the function after a new post is created
drop trigger if exists on_new_post_notify_alerts on posts;
create trigger on_new_post_notify_alerts
    after insert on posts
    for each row
    execute function notify_matching_alerts();
