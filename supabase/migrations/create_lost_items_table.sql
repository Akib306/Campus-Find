-- Create lost_items table
CREATE TABLE IF NOT EXISTS lost_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  date_found DATE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create storage bucket for item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('item_photos', 'item_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies (allow public read, authenticated write)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'item_photos');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item_photos');