/*
  # Restrict Media Deletion to Admin Users Only

  ## Overview
  This migration updates the media deletion policy to only allow admin users to delete any media files.
  
  ## Changes
  1. Drop the existing "Users can delete own media" policy
  2. Create a new "Only admins can delete media" policy that checks is_admin flag
  
  ## Security
  - Only users with is_admin = true in their profile can delete any media
  - This provides centralized control over content moderation
  - Prevents users from accidentally deleting their own content
  - Ensures content preservation and admin oversight
*/

-- Drop the existing policy that allowed users to delete their own media
DROP POLICY IF EXISTS "Users can delete own media" ON media;

-- Create new policy that only allows admin users to delete any media
CREATE POLICY "Only admins can delete media"
  ON media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Add a comment to document this security change
COMMENT ON POLICY "Only admins can delete media" ON media IS 
'Only users with admin privileges can delete media files. This ensures content preservation and centralized moderation control.';