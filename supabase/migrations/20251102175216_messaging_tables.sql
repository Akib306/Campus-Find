-- Create conversations table referencing profiles and posts
CREATE TABLE if not exists conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  arranged_location TEXT,
  arranged_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE if not exists messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('claim_initial', 'suggestion', 'confirmation', 'status_update', 'share_contact')),
  content TEXT,
  display_text TEXT,
  sender_id UUID REFERENCES profiles(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pickup_options table
CREATE TABLE if not exists pickup_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_type TEXT NOT NULL CHECK (option_type IN ('location', 'time_slot', 'delay_time')),
  value TEXT NOT NULL,
  display_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  CREATE POLICY "Users can view conversations they are part of" ON conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Users can insert messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
      )
    );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anyone can view pickup options" ON pickup_options
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- Insert USask pickup locations
INSERT INTO pickup_options (option_type, value, display_text, sort_order) VALUES
('location', 'place_riel', 'Place Riel', 1),
('location', 'murray_library', 'Murray Library', 2),
('location', 'education_gym', 'Education Gym', 3),
('location', 'pac_gym', 'PAC Gym', 4),
('location', 'health_sciences_library', 'Health Sciences Library', 5);

-- Insert time slots from 9 AM to 9 PM
INSERT INTO pickup_options (option_type, value, display_text, sort_order) VALUES
('time_slot', '09:00-09:30', '9:00 AM - 9:30 AM', 1),
('time_slot', '09:30-10:00', '9:30 AM - 10:00 AM', 2),
('time_slot', '10:00-10:30', '10:00 AM - 10:30 AM', 3),
('time_slot', '10:30-11:00', '10:30 AM - 11:00 AM', 4),
('time_slot', '11:00-11:30', '11:00 AM - 11:30 AM', 5),
('time_slot', '11:30-12:00', '11:30 AM - 12:00 PM', 6),
('time_slot', '12:00-12:30', '12:00 PM - 12:30 PM', 7),
('time_slot', '12:30-13:00', '12:30 PM - 1:00 PM', 8),
('time_slot', '13:00-13:30', '1:00 PM - 1:30 PM', 9),
('time_slot', '13:30-14:00', '1:30 PM - 2:00 PM', 10),
('time_slot', '14:00-14:30', '2:00 PM - 2:30 PM', 11),
('time_slot', '14:30-15:00', '2:30 PM - 3:00 PM', 12),
('time_slot', '15:00-15:30', '3:00 PM - 3:30 PM', 13),
('time_slot', '15:30-16:00', '3:30 PM - 4:00 PM', 14),
('time_slot', '16:00-16:30', '4:00 PM - 4:30 PM', 15),
('time_slot', '16:30-17:00', '4:30 PM - 5:00 PM', 16),
('time_slot', '17:00-17:30', '5:00 PM - 5:30 PM', 17),
('time_slot', '17:30-18:00', '5:30 PM - 6:00 PM', 18),
('time_slot', '18:00-18:30', '6:00 PM - 6:30 PM', 19),
('time_slot', '18:30-19:00', '6:30 PM - 7:00 PM', 20),
('time_slot', '19:00-19:30', '7:00 PM - 7:30 PM', 21),
('time_slot', '19:30-20:00', '7:30 PM - 8:00 PM', 22),
('time_slot', '20:00-20:30', '8:00 PM - 8:30 PM', 23),
('time_slot', '20:30-21:00', '8:30 PM - 9:00 PM', 24);

