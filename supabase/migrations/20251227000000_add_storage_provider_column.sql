-- Add storage_provider column to media table for multi-storage support
-- This tracks which storage provider (Supabase project) contains each media file

-- Add the storage_provider column
ALTER TABLE media ADD COLUMN storage_provider TEXT DEFAULT 'storage1';

-- Update existing records to use storage1 (current default)
UPDATE media SET storage_provider = 'storage1' WHERE storage_provider IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE media ALTER COLUMN storage_provider SET NOT NULL;

-- Add index for performance when querying by storage provider
CREATE INDEX idx_media_storage_provider ON media(storage_provider);

-- Add check constraint to ensure valid storage provider values
ALTER TABLE media ADD CONSTRAINT chk_media_storage_provider 
  CHECK (storage_provider IN ('storage1', 'storage2', 'storage3', 'storage4'));

-- Add comment for documentation
COMMENT ON COLUMN media.storage_provider IS 'Identifies which storage provider/Supabase project contains this media file';