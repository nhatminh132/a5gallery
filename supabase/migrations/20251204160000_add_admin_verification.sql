/*
  # Add Admin Verification System
  
  This migration adds admin verification functionality for user uploads.
  
  ## Changes:
  1. Add verification status and admin fields to media table
  2. Add admin role to profiles table
  3. Update RLS policies to handle verification
  4. Create functions for admin operations
*/

-- Add verification and admin fields to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS verification_notes text;

-- Add admin role to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false NOT NULL;

-- Set the specified email as admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'lpnminh472@gmail.com';

-- Create index for verification queries
CREATE INDEX IF NOT EXISTS idx_media_verified ON media(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;

-- Update media policies for public viewing but authenticated upload
DROP POLICY IF EXISTS "Users can view all media" ON media;

-- Allow anonymous users to view verified media
CREATE POLICY "Anyone can view verified media"
  ON media FOR SELECT
  USING (is_verified = true);

-- Allow authenticated users to view their own media (verified or not)
CREATE POLICY "Users can view own media"
  ON media FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to view all media
CREATE POLICY "Admins can view all media"
  ON media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Update insert policy - uploads start as unverified
DROP POLICY IF EXISTS "Users can insert own media" ON media;
CREATE POLICY "Users can insert own media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_verified = false);

-- Allow admins to update verification status
CREATE POLICY "Admins can update media verification"
  ON media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to verify media (admin only)
CREATE OR REPLACE FUNCTION verify_media(
  media_id uuid,
  verification_notes text DEFAULT null
)
RETURNS boolean AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if current user is admin
  SELECT id INTO admin_id 
  FROM profiles 
  WHERE id = auth.uid() AND is_admin = true;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can verify media';
  END IF;
  
  -- Update media verification
  UPDATE media 
  SET 
    is_verified = true,
    verified_at = now(),
    verified_by = admin_id,
    verification_notes = verification_notes
  WHERE id = media_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject media (admin only)
CREATE OR REPLACE FUNCTION reject_media(
  media_id uuid,
  rejection_reason text DEFAULT 'Content does not meet guidelines'
)
RETURNS boolean AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if current user is admin
  SELECT id INTO admin_id 
  FROM profiles 
  WHERE id = auth.uid() AND is_admin = true;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can reject media';
  END IF;
  
  -- Update media with rejection
  UPDATE media 
  SET 
    verification_notes = rejection_reason
  WHERE id = media_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_media(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_media(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin(uuid) TO authenticated;