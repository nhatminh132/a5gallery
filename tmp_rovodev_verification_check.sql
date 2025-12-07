-- Supabase-compatible SQL to check verification system
-- Run each section separately in Supabase SQL Editor

-- 1. Check if is_verified column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'media' AND column_name = 'is_verified';

-- 2. If the above returns no rows, add the column:
-- ALTER TABLE media ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 3. Check current media verification status
SELECT 
  id,
  title,
  user_id,
  is_verified,
  verified_at,
  verified_by,
  verification_notes,
  upload_date
FROM media 
ORDER BY upload_date DESC 
LIMIT 10;

-- 4. Check if verification functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('verify_media', 'reject_media');

-- 5. Count verified vs unverified media
SELECT 
  is_verified,
  COUNT(*) as count
FROM media 
GROUP BY is_verified;

-- 6. If you need to set existing media as verified (for testing):
-- UPDATE media SET is_verified = true WHERE upload_date < NOW();