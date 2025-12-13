-- =====================================================
-- Create Slider Featured Table for Dashboard Management
-- =====================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- and run it to enable admin slider image management

-- Create the slider_featured table
CREATE TABLE IF NOT EXISTS slider_featured (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slider_featured_media_id ON slider_featured(media_id);
CREATE INDEX IF NOT EXISTS idx_slider_featured_order ON slider_featured(display_order);
CREATE INDEX IF NOT EXISTS idx_slider_featured_created_by ON slider_featured(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE slider_featured ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to view featured images (for displaying the slider)
CREATE POLICY "Anyone can view featured slider images"
    ON slider_featured FOR SELECT
    TO authenticated, anon
    USING (true);

-- Policy: Only admins can manage featured images (insert, update, delete)
CREATE POLICY "Only admins can manage featured slider images"
    ON slider_featured FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.is_admin = true 
                OR profiles.email = 'lpnminh472@gmail.com'
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.is_admin = true 
                OR profiles.email = 'lpnminh472@gmail.com'
            )
        )
    );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_slider_featured_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_slider_featured_updated_at_trigger
    BEFORE UPDATE ON slider_featured
    FOR EACH ROW
    EXECUTE FUNCTION update_slider_featured_updated_at();

-- Add helpful comments to document the table
COMMENT ON TABLE slider_featured IS 'Stores which images are featured in the dashboard slider, managed by admins only';
COMMENT ON COLUMN slider_featured.media_id IS 'References the media table - which image to feature';
COMMENT ON COLUMN slider_featured.display_order IS 'Order in which images appear in the slider (0 = first, 1 = second, etc.)';
COMMENT ON COLUMN slider_featured.created_by IS 'Which admin user selected this image for the slider';
COMMENT ON COLUMN slider_featured.created_at IS 'When this image was added to the slider';
COMMENT ON COLUMN slider_featured.updated_at IS 'When this record was last modified';

-- Grant necessary permissions
GRANT SELECT ON slider_featured TO authenticated, anon;
GRANT ALL ON slider_featured TO authenticated;

-- Optional: Add some default featured images (latest 3 images)
-- Remove this section if you don't want default selections
INSERT INTO slider_featured (media_id, display_order, created_by)
SELECT 
    id as media_id,
    ROW_NUMBER() OVER (ORDER BY upload_date DESC) - 1 as display_order,
    user_id as created_by
FROM media 
WHERE file_type LIKE 'image%'
ORDER BY upload_date DESC 
LIMIT 3
ON CONFLICT DO NOTHING;

-- Verify the table was created successfully
SELECT 
    'SUCCESS: slider_featured table created!' as status,
    COUNT(*) as featured_images_count,
    'Admin can now manage slider images in Settings > Admin Panel > Slider Images' as next_step
FROM slider_featured;

-- Show current featured images (if any)
SELECT 
    sf.display_order,
    m.title as image_title,
    m.file_type,
    p.email as selected_by,
    sf.created_at as added_on
FROM slider_featured sf
JOIN media m ON sf.media_id = m.id
LEFT JOIN profiles p ON sf.created_by = p.id
ORDER BY sf.display_order;