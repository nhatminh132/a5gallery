-- SQL to fix verification system setup
-- Run this if verification is not working

-- 1. Add is_verified column if it doesn't exist
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 2. Add other verification columns if they don't exist
ALTER TABLE media ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE media ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES profiles(id);
ALTER TABLE media ADD COLUMN IF NOT EXISTS verification_notes text;

-- 3. Set all existing media as unverified (they need admin approval)
UPDATE media SET is_verified = false WHERE is_verified IS NULL;

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_media_verified ON media(is_verified);

-- 5. Check the result
SELECT 
  'Setup complete' as status,
  COUNT(*) as total_media,
  SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_count,
  SUM(CASE WHEN is_verified = false THEN 1 ELSE 0 END) as unverified_count
FROM media;