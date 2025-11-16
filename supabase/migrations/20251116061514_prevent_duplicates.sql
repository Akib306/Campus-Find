-- Update trigger to remove spaces before matching keywords
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

        -- Check if category matches (with explicit type casting)
        if NEW.item_category::text = alert_record.categories::text THEN
            -- If keywords are empty/null, category match alone is enough
            if alert_record.keywords is null or array_length(alert_record.keywords, 1) is null THEN
                matches := true;
            else
                -- Keywords exist, check if any keyword matches (space-insensitive)
                foreach keyword in array alert_record.keywords
                Loop
                    if replace(lower(NEW.item_name), ' ', '') ILIKE '%' || replace(lower(keyword), ' ', '') || '%' THEN
                        matches := true;
                        exit;
                    end if;
                end loop;
            end if;
        end if;

    -- If a match was found, create a notification
    -- Check if the match is not directed to the same user and notification doesn't already exist
    if matches and alert_record.user_id != NEW.user_id THEN
        if not exists (
            select 1 from notifications
            where user_id = alert_record.user_id
            and link = '/posts/' || NEW.id
        ) then
            insert into notifications (user_id, message, type, link)
            values (
                alert_record.user_id,
                'New post matching your alert: ' || NEW.item_name,
                'in_app',
                '/posts/' || NEW.id
            );
        end if;
    end if;
    end loop;
    return new;
END;
$$ language plpgsql;
