/*
  # Update Slider Featured Table for Media ID System

  ## Overview
  Updates the slider_featured table to use the new media_id system instead of UUID references.
  This allows the slider to reference images by their unique media_id (10-20 digit number).
  
  ## Changes
  1. Drop existing foreign key constraint (if exists)
  2. Change media_id column type from UUID to TEXT
  3. Update existing records to use new media_id values
  4. Add new constraints for media_id format validation
  
  ## Note
  This assumes the media table already has the media_id column added from previous migration.
*/

-- Step 1: Check if slider_featured table exists and has data
DO $$
DECLARE
    table_exists BOOLEAN;
    record_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'slider_featured'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) FROM slider_featured INTO record_count;
        RAISE NOTICE 'Found slider_featured table with % records', record_count;
        
        -- Step 2: Drop foreign key constraint if it exists
        ALTER TABLE slider_featured DROP CONSTRAINT IF EXISTS slider_featured_media_id_fkey;
        
        -- Step 3: Change column type from UUID to TEXT first
        ALTER TABLE slider_featured 
        ALTER COLUMN media_id TYPE TEXT USING media_id::TEXT;
        
        -- Step 4: If there are existing records, try to migrate them
        IF record_count > 0 THEN
            RAISE NOTICE 'Attempting to migrate existing slider_featured records...';
            
            -- Create temporary backup of existing data  
            CREATE TEMP TABLE slider_featured_backup AS 
            SELECT 
                media_id::TEXT as old_media_id, 
                display_order, 
                created_by, 
                created_at, 
                updated_at 
            FROM slider_featured;
            
            -- Clear the table
            DELETE FROM slider_featured;
            
            -- Attempt to migrate records using new media_id
            INSERT INTO slider_featured (media_id, display_order, created_by, created_at, updated_at)
            SELECT 
                m.media_id,
                sfb.display_order,
                sfb.created_by,
                sfb.created_at,
                sfb.updated_at
            FROM slider_featured_backup sfb
            JOIN media m ON m.id::TEXT = sfb.old_media_id
            WHERE m.media_id IS NOT NULL
            ORDER BY sfb.display_order;
            
            RAISE NOTICE 'Migrated % records to new media_id format', 
                (SELECT COUNT(*) FROM slider_featured);
        END IF;
        
        -- Step 5: Add constraints for new media_id format
        ALTER TABLE slider_featured 
        ADD CONSTRAINT check_slider_media_id_format 
        CHECK (
            media_id ~ '^[0-9]{10,20}$' AND 
            LENGTH(media_id) >= 10 AND 
            LENGTH(media_id) <= 20
        );
        
        -- Step 6: Create new index for performance
        CREATE INDEX IF NOT EXISTS idx_slider_featured_media_id_text ON slider_featured(media_id);
        
        -- Step 7: Add foreign key reference to media.media_id
        ALTER TABLE slider_featured 
        ADD CONSTRAINT slider_featured_media_id_fkey 
        FOREIGN KEY (media_id) REFERENCES media(media_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Successfully updated slider_featured table for media_id system';
        
    ELSE
        RAISE NOTICE 'slider_featured table does not exist - will be created with correct structure when first used';
    END IF;
END $$;

-- Add helpful comment
COMMENT ON COLUMN slider_featured.media_id IS 'References media.media_id (unique 10-20 digit identifier) instead of UUID';

-- Verify the update
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'slider_featured'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Show current state
        RAISE NOTICE 'SUCCESS: slider_featured updated for media_id system. Featured images: %', 
            (SELECT COUNT(*) FROM slider_featured);
        
        -- Log sample of current featured images
        RAISE NOTICE 'Ready for admin media_id selection';
        
        -- Show sample data in notice (if any exists)
        IF EXISTS (SELECT 1 FROM slider_featured LIMIT 1) THEN
            RAISE NOTICE 'Sample featured images: %', 
                (SELECT string_agg(media_id || ' (order: ' || display_order::TEXT || ')', ', ') 
                 FROM (SELECT media_id, display_order FROM slider_featured ORDER BY display_order LIMIT 3) AS sample);
        END IF;
    END IF;
END $$;