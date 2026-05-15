
-- Extend posts for richer video support
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aspect_ratio NUMERIC;

-- Backfill media_type for existing youtube posts
UPDATE public.posts SET media_type = 'youtube' WHERE youtube_url IS NOT NULL AND media_type = 'text';

-- Storage bucket for uploaded videos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 'videos', true, 104857600,
  ARRAY['video/mp4','video/webm','video/quicktime','video/x-matroska']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for videos bucket (folder = user id)
DROP POLICY IF EXISTS "videos public read" ON storage.objects;
CREATE POLICY "videos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos auth upload own" ON storage.objects;
CREATE POLICY "videos auth upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "videos update own" ON storage.objects;
CREATE POLICY "videos update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "videos delete own" ON storage.objects;
CREATE POLICY "videos delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Safe view counter
CREATE OR REPLACE FUNCTION public.increment_post_views(p_post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.posts SET views = views + 1 WHERE id = p_post_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO anon, authenticated;
