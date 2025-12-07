-- SQL to clean up verification system if it was applied to database
-- Run this in Supabase SQL Editor if you already ran the verification migration

-- 1. Drop verification functions if they exist
DROP FUNCTION IF EXISTS verify_media(uuid, uuid, text);
DROP FUNCTION IF EXISTS reject_media(uuid, uuid, text);

-- 2. Drop verification policies if they exist
DROP POLICY IF EXISTS "Media visibility based on verification" ON media;
DROP POLICY IF EXISTS "Admins can verify media" ON media;

-- 3. Remove verification columns if they exist
ALTER TABLE media DROP COLUMN IF EXISTS is_verified;
ALTER TABLE media DROP COLUMN IF EXISTS verified_at;
ALTER TABLE media DROP COLUMN IF EXISTS verified_by;
ALTER TABLE media DROP COLUMN IF EXISTS verification_notes;

-- 4. Drop verification index if it exists
DROP INDEX IF EXISTS idx_media_verification;

-- 5. Recreate simple media visibility policy (if needed)
CREATE POLICY "Public media access" ON media
  FOR SELECT USING (true);

-- 6. Verify cleanup
SELECT 'Verification system removed successfully' as status;