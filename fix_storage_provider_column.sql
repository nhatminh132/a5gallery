-- Migration script to add storage_provider column to media table
-- This fixes the "Could not find the 'storage_provider' column" error

-- Step 1: Add the storage_provider column with default value
ALTER TABLE media ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'storage1';

-- Step 2: Update any existing records to use the default storage provider
UPDATE media SET storage_provider = 'storage1' WHERE storage_provider IS NULL;

-- Step 3: Make the column NOT NULL after setting defaults
ALTER TABLE media ALTER COLUMN storage_provider SET NOT NULL;

-- Step 4: Add an index for better performance when querying by storage provider
CREATE INDEX IF NOT EXISTS idx_media_storage_provider ON media(storage_provider);

-- Step 5: Add a check constraint to ensure valid storage provider values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_media_storage_provider'
        AND table_name = 'media'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE media ADD CONSTRAINT chk_media_storage_provider 
        CHECK (storage_provider IN ('storage1', 'storage2', 'storage3', 'storage4'));
    END IF;
END
$$;

-- Step 6: Add a helpful comment
COMMENT ON COLUMN media.storage_provider IS 'Identifies which storage provider/Supabase project contains this media file. Used for multi-storage support.';

-- Verification query - run this to confirm the column was added successfully
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'media' AND column_name = 'storage_provider';