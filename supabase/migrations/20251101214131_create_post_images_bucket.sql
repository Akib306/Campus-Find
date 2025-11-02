insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,                                -- public bucket; accessible via /object/public
  5242880,                             -- 5 MB per file (adjust as needed)
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence'
  ]
)
on conflict (id) do nothing;

-- Usage notes at runtime store the images in this url format:
-- - Public URL shape: ${SUPABASE_URL}/storage/v1/object/public/post-images/{post_id}/{filename}