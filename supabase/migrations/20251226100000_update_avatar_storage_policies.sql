/*
  # Update Avatar Storage Policies

  ## Overview
  This migration updates storage policies to allow users to manage avatars in the media bucket.

  ## Changes
  - Allow users to upload avatars to avatars/ folder in media bucket
  - Allow users to delete their own avatars
  - Maintain public read access for avatars

  ## Important Notes
  - Avatars are stored in media bucket under avatars/ folder
  - Users can only manage their own avatar files
  - Public read access is already covered by existing media bucket policy
*/

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    name LIKE 'avatars/%' AND
    split_part(name, '/', 2) LIKE auth.uid()::text || '%'
  );

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    name LIKE 'avatars/%' AND
    split_part(name, '/', 2) LIKE auth.uid()::text || '%'
  );

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    name LIKE 'avatars/%' AND
    split_part(name, '/', 2) LIKE auth.uid()::text || '%'
  );