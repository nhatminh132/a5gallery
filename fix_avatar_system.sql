-- Fix for missing is_admin column
-- Run this in your Supabase SQL editor to add the admin functionality

-- Add admin role to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false NOT NULL;

-- Set the specified email as admin (update this email as needed)
UPDATE profiles 
SET is_admin = true 
WHERE email = 'lpnminh472@gmail.com';

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;

-- Add verification fields to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS verification_notes text;

-- Create index for verification queries
CREATE INDEX IF NOT EXISTS idx_media_verified ON media(is_verified);

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