/*
  # Add Unique Media ID Column

  ## Overview
  This migration adds a unique media_id column to the media table to prevent
  filename duplication issues and provide a robust identification system.
  
  ## Changes
  1. Add media_id column (TEXT, unique, 10-20 digits)
  2. Create unique index on media_id
  3. Update existing records with generated IDs
  4. Make media_id NOT NULL
  
  ## Benefits
  - Eliminates filename duplication issues
  - Provides unique identification for each media file
  - Enables better file management and referencing
*/

-- Add media_id column as nullable first
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS media_id TEXT;

-- Create function to generate unique media IDs (similar to the JS function)
CREATE OR REPLACE FUNCTION generate_unique_media_id()
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    random_part TEXT;
    unique_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Get current timestamp (13 digits)
        timestamp_part := (EXTRACT(epoch FROM NOW()) * 1000)::BIGINT::TEXT;
        
        -- Generate random 6 digits
        random_part := LPAD((RANDOM() * 999999)::INT::TEXT, 6, '0');
        
        -- Combine to create 19-digit ID
        unique_id := timestamp_part || random_part;
        
        -- Check if this ID already exists
        SELECT EXISTS(SELECT 1 FROM media WHERE media_id = unique_id) INTO id_exists;
        
        -- If unique, return it
        IF NOT id_exists THEN
            RETURN unique_id;
        END IF;
        
        -- Small delay to ensure different timestamp on retry
        PERFORM pg_sleep(0.001);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with unique media IDs
UPDATE media 
SET media_id = generate_unique_media_id()
WHERE media_id IS NULL;

-- Make media_id NOT NULL and add unique constraint
ALTER TABLE media 
ALTER COLUMN media_id SET NOT NULL;

-- Create unique index on media_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_unique_media_id ON media(media_id);

-- Create regular index for performance
CREATE INDEX IF NOT EXISTS idx_media_media_id ON media(media_id);

-- Add constraint to ensure media_id is between 10-20 characters
ALTER TABLE media 
ADD CONSTRAINT check_media_id_length 
CHECK (LENGTH(media_id) >= 10 AND LENGTH(media_id) <= 20);

-- Add constraint to ensure media_id contains only digits
ALTER TABLE media 
ADD CONSTRAINT check_media_id_digits 
CHECK (media_id ~ '^[0-9]+$');

-- Update slider_featured table to use media_id instead of UUID if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'slider_featured') THEN
        -- Check if we need to update the reference
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slider_featured' AND column_name = 'media_id' AND data_type = 'uuid') THEN
            -- This would require more complex migration, for now just add note
            RAISE NOTICE 'Note: slider_featured table exists with UUID media_id. Consider updating to use new media_id format.';
        END IF;
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN media.media_id IS 'Unique media identifier (10-20 digits) used for filename and referencing';
COMMENT ON INDEX idx_media_unique_media_id IS 'Ensures media_id uniqueness across all media files';

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_unique_media_id() TO authenticated;

-- Verify the migration
SELECT 
    'SUCCESS: media_id column added and populated!' as status,
    COUNT(*) as total_media,
    COUNT(media_id) as media_with_ids,
    MIN(LENGTH(media_id)) as min_id_length,
    MAX(LENGTH(media_id)) as max_id_length
FROM media;

-- Show sample of new media IDs
SELECT 
    id,
    media_id,
    filename,
    LENGTH(media_id) as id_length
FROM media 
ORDER BY created_at DESC 
LIMIT 5;