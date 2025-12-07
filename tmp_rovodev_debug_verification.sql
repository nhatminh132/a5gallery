-- Debug script to check verification system
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if is_verified column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'media' AND column_name = 'is_verified';

-- 2. Check current media verification status
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

-- 3. Check if verification functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('verify_media', 'reject_media');

-- 4. Test verification function manually (replace 'your-media-id' with actual ID)
-- SELECT verify_media('your-media-id', 'Test verification');

-- 5. Check media table structure
\d media;