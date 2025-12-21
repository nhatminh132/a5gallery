/*
  # Add Avatar ID System

  ## Overview
  Add a unique avatar_id column to profiles table to track avatar changes
  Similar to how media has unique media_id

  ## Changes
  - Add avatar_id column to profiles table
  - Add avatar metadata tracking
  - Allow better avatar management and history

  ## Important Notes
  - avatar_id will be generated when users upload new avatars
  - Existing avatar_url values are preserved
  - This enables better avatar management and tracking
*/

-- Add avatar_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN avatar_id VARCHAR(20) DEFAULT NULL;

-- Add avatar metadata columns for better tracking
ALTER TABLE profiles 
ADD COLUMN avatar_upload_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN avatar_file_size INTEGER DEFAULT NULL,
ADD COLUMN avatar_file_type VARCHAR(50) DEFAULT NULL;

-- Create index for faster avatar_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_id ON profiles(avatar_id);

-- Add comment explaining the avatar_id system
COMMENT ON COLUMN profiles.avatar_id IS 'Unique identifier for uploaded avatar images, similar to media_id system';
COMMENT ON COLUMN profiles.avatar_upload_date IS 'Timestamp when avatar was uploaded';
COMMENT ON COLUMN profiles.avatar_file_size IS 'Size of avatar file in bytes';
COMMENT ON COLUMN profiles.avatar_file_type IS 'MIME type of avatar file (e.g., image/jpeg)';