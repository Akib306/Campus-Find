-- Improve alert notification messages to include more context
create or replace function notify_matching_alerts()
returns trigger as $$
DECLARE
    alert_record record;
    keyword text;
    matches boolean;
    matched_keywords text[];
    message_text text;
BEGIN
    -- Loop through all active alerts
    for alert_record in
        select id, user_id, categories, keywords
        from user_alerts
    loop
        
        matches := false;
        matched_keywords := '{}';

        -- Check if category matches (with explicit type casting)
        if NEW.item_category::text = alert_record.categories::text THEN
            -- If keywords are empty/null, category match alone is enough
            if alert_record.keywords is null or array_length(alert_record.keywords, 1) is null THEN
                matches := true;
            else
                -- Keywords exist, check if any keyword matches in name OR description (space-insensitive)
                foreach keyword in array alert_record.keywords
                loop
                    if replace(lower(NEW.item_name), ' ', '') ILIKE '%' || replace(lower(keyword), ' ', '') || '%' 
                       or replace(lower(NEW.description), ' ', '') ILIKE '%' || replace(lower(keyword), ' ', '') || '%' THEN
                        matches := true;
                        matched_keywords := array_append(matched_keywords, keyword);
                    end if;
                end loop;
            end if;
        end if;

    -- If a match was found, create a notification with a detailed message
    -- Check if the match is not directed to the same user and notification doesn't already exist
    if matches and alert_record.user_id != NEW.user_id THEN
        if not exists (
            select 1 from notifications
            where user_id = alert_record.user_id
            and link = '/listings/' || NEW.id
        ) then
            -- Create a detailed message
            message_text := 'Found: ' || NEW.item_name || ' (' || NEW.item_category || ')';
            
            -- Add location if available
            if NEW.location_name is not null and NEW.location_name != '' THEN
                message_text := message_text || ' at ' || NEW.location_name;
            end if;
            
            -- Add matched keywords if there exists specific keywords
            if array_length(matched_keywords, 1) > 0 THEN
                if array_length(matched_keywords, 1) > 2 THEN
                    message_text := message_text || ' | Matched: ' || array_to_string(matched_keywords[1:2], ', ') || '...'; 
                else
                    message_text := message_text || ' | Matched: ' || array_to_string(matched_keywords, ', ');
                end if;
            end if;           
            
            insert into notifications (user_id, message, type, link)
            values (
                alert_record.user_id,
                message_text,
                'in_app',
                '/listings/' || NEW.id
            );
        end if;
    end if;
    end loop;
    return new;
END;
$$ language plpgsql;
