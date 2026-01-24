-- Add analytics counters to media table
-- Track views, downloads, comments count, likes count

ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_view_count ON public.media(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_media_download_count ON public.media(download_count DESC);

-- Create view tracking table
CREATE TABLE IF NOT EXISTS public.media_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_media_views_media_id ON public.media_views(media_id);
CREATE INDEX IF NOT EXISTS idx_media_views_user_id ON public.media_views(user_id);
CREATE INDEX IF NOT EXISTS idx_media_views_viewed_at ON public.media_views(viewed_at DESC);

-- Create download tracking table
CREATE TABLE IF NOT EXISTS public.media_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_media_downloads_media_id ON public.media_downloads(media_id);
CREATE INDEX IF NOT EXISTS idx_media_downloads_user_id ON public.media_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_media_downloads_downloaded_at ON public.media_downloads(downloaded_at DESC);

-- Enable RLS
ALTER TABLE public.media_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for views
CREATE POLICY "Anyone can view media_views"
  ON public.media_views
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert media_views"
  ON public.media_views
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for downloads
CREATE POLICY "Anyone can view media_downloads"
  ON public.media_downloads
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert media_downloads"
  ON public.media_downloads
  FOR INSERT
  WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_media_view_count(media_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.media
  SET view_count = view_count + 1
  WHERE id = media_uuid;
END;
$$;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_media_download_count(media_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.media
  SET download_count = download_count + 1
  WHERE id = media_uuid;
END;
$$;

-- Add comments
COMMENT ON COLUMN public.media.view_count IS 'Total number of views';
COMMENT ON COLUMN public.media.download_count IS 'Total number of downloads';
COMMENT ON TABLE public.media_views IS 'Tracks individual media views with timestamps';
COMMENT ON TABLE public.media_downloads IS 'Tracks individual media downloads with timestamps';
