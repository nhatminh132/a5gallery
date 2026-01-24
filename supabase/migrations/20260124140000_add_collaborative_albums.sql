-- Add collaborative albums feature
-- Multiple users can contribute to the same album

-- Add album collaborators table
CREATE TABLE IF NOT EXISTS public.album_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'contributor', -- 'contributor' or 'viewer'
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_album_collaborators_album_id ON public.album_collaborators(album_id);
CREATE INDEX IF NOT EXISTS idx_album_collaborators_user_id ON public.album_collaborators(user_id);

-- Enable RLS
ALTER TABLE public.album_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Album owner and collaborators can view collaborators"
  ON public.album_collaborators
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM public.albums WHERE id = album_id
      UNION
      SELECT user_id FROM public.album_collaborators WHERE album_id = album_collaborators.album_id
    )
  );

CREATE POLICY "Album owner can add collaborators"
  ON public.album_collaborators
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_id
      AND albums.creator_id = auth.uid()
    )
  );

CREATE POLICY "Album owner can remove collaborators"
  ON public.album_collaborators
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_id
      AND albums.creator_id = auth.uid()
    )
  );

-- Update albums RLS to allow collaborators to view
DROP POLICY IF EXISTS "Users can view their own albums and public albums" ON public.albums;

CREATE POLICY "Users can view own, public, or collaborative albums"
  ON public.albums
  FOR SELECT
  USING (
    creator_id = auth.uid()
    OR visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM public.album_collaborators
      WHERE album_collaborators.album_id = albums.id
      AND album_collaborators.user_id = auth.uid()
    )
  );

-- Allow collaborators with 'contributor' role to add media to album
CREATE POLICY "Collaborators can add media to shared albums"
  ON public.album_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = album_id
      AND (
        albums.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.album_collaborators
          WHERE album_collaborators.album_id = albums.id
          AND album_collaborators.user_id = auth.uid()
          AND album_collaborators.role = 'contributor'
        )
      )
    )
  );

-- Function to get album collaborators
CREATE OR REPLACE FUNCTION get_album_collaborators(album_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.user_id,
    p.full_name,
    p.avatar_url,
    ac.role,
    ac.added_at
  FROM public.album_collaborators ac
  JOIN public.profiles p ON p.id = ac.user_id
  WHERE ac.album_id = album_uuid
  ORDER BY ac.added_at ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_album_collaborators TO authenticated;

-- Add comments
COMMENT ON TABLE public.album_collaborators IS 'Manages collaborative access to albums';
COMMENT ON COLUMN public.album_collaborators.role IS 'contributor can add media, viewer can only view';
