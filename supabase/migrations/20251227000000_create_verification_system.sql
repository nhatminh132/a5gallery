-- Complete verification system setup
-- This migration creates a robust verification system from scratch

-- 1. Add verification columns to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS verification_notes text;

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_media_verification ON media(is_verified, user_id);

-- 3. Set existing media as unverified (requires admin approval)
UPDATE media SET is_verified = false WHERE is_verified IS NULL;

-- 4. Create verification functions
CREATE OR REPLACE FUNCTION verify_media(media_id uuid, admin_id uuid, notes text DEFAULT NULL)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Update media record
  UPDATE media 
  SET 
    is_verified = true,
    verified_at = NOW(),
    verified_by = admin_id,
    verification_notes = notes
  WHERE id = media_id;
  
  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'Media verified successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Media not found'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create rejection function
CREATE OR REPLACE FUNCTION reject_media(media_id uuid, admin_id uuid, notes text DEFAULT 'Content rejected by admin')
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Update media record
  UPDATE media 
  SET 
    is_verified = false,
    verified_at = NOW(),
    verified_by = admin_id,
    verification_notes = notes
  WHERE id = media_id;
  
  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'Media rejected successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Media not found'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RLS policies for verification system
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Media visibility policy" ON media;

-- Create new visibility policy
CREATE POLICY "Media visibility based on verification" ON media
  FOR SELECT USING (
    -- Admin can see everything
    (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)) OR
    -- User can see their own content
    (auth.uid() = user_id) OR
    -- Everyone can see verified content
    (is_verified = true)
  );

-- Create policy for media updates (only admins can verify)
CREATE POLICY "Admins can verify media" ON media
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- 7. Grant permissions for verification functions
GRANT EXECUTE ON FUNCTION verify_media TO authenticated;
GRANT EXECUTE ON FUNCTION reject_media TO authenticated;