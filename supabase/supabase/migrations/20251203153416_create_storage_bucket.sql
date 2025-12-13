/*
  # Create Storage Bucket for Media Files

  ## Overview
  This migration creates a public storage bucket for storing media files (images and videos).

  ## 1. Storage Buckets
  
  ### `media` bucket
  - Public bucket for storing user-uploaded images and videos
  - Allows authenticated users to upload files
  - Files are publicly accessible via URL

  ## 2. Security
  
  ### Storage Policies
  - Allow authenticated users to upload files to their own folders
  - Allow authenticated users to delete their own files
  - Allow public read access to all files

  ## 3. Important Notes
  - The bucket is configured as public to allow easy media viewing
  - Users can only upload/delete files in their own folders (user_id)
  - File paths follow the pattern: user_id/filename
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete own files
CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');