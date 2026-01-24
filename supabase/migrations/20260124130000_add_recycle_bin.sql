-- Add recycle bin for soft-deleted media
-- Media stays in recycle bin for 5 days before permanent deletion

-- Add soft delete column
ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add index for soft-deleted items
CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON public.media(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create function to permanently delete old items from recycle bin
CREATE OR REPLACE FUNCTION cleanup_recycle_bin()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete media older than 5 days in recycle bin
  WITH deleted AS (
    DELETE FROM public.media
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '5 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Create function to restore from recycle bin
CREATE OR REPLACE FUNCTION restore_from_recycle_bin(media_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.media
  SET deleted_at = NULL,
      deleted_by = NULL
  WHERE id = media_uuid
  AND deleted_at IS NOT NULL;
END;
$$;

-- Create function to soft delete media
CREATE OR REPLACE FUNCTION soft_delete_media(media_uuid UUID, user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.media
  SET deleted_at = NOW(),
      deleted_by = user_uuid
  WHERE id = media_uuid
  AND deleted_at IS NULL;
END;
$$;

-- Update RLS policies to exclude deleted items from normal queries
DROP POLICY IF EXISTS "Public media are viewable by everyone" ON public.media;

CREATE POLICY "Public non-deleted media are viewable by everyone"
  ON public.media
  FOR SELECT
  USING (deleted_at IS NULL);

-- Admin/Owner can view deleted items
CREATE POLICY "Admins and owners can view deleted media"
  ON public.media
  FOR SELECT
  USING (
    deleted_at IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
      OR user_id = auth.uid()
    )
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_recycle_bin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION restore_from_recycle_bin TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_media TO authenticated;

-- Add comments
COMMENT ON COLUMN public.media.deleted_at IS 'Timestamp when media was soft-deleted (moved to recycle bin)';
COMMENT ON COLUMN public.media.deleted_by IS 'User who deleted the media';
COMMENT ON FUNCTION cleanup_recycle_bin IS 'Permanently deletes media from recycle bin older than 5 days';
COMMENT ON FUNCTION restore_from_recycle_bin IS 'Restores media from recycle bin';
COMMENT ON FUNCTION soft_delete_media IS 'Soft deletes media (moves to recycle bin)';
