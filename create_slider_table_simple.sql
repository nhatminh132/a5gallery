-- =====================================================
-- Simple Slider Featured Table Creation
-- =====================================================
-- Copy and paste this script into your Supabase SQL Editor

-- Create the slider_featured table
CREATE TABLE IF NOT EXISTS slider_featured (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slider_featured_media_id ON slider_featured(media_id);
CREATE INDEX IF NOT EXISTS idx_slider_featured_order ON slider_featured(display_order);

-- Enable Row Level Security
ALTER TABLE slider_featured ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view featured images (for the slider)
CREATE POLICY "Anyone can view featured slider images"
    ON slider_featured FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only specific admin users can manage featured images
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

-- Grant permissions
GRANT SELECT ON slider_featured TO authenticated, anon;
GRANT ALL ON slider_featured TO authenticated;

-- Add some default featured images (latest 3 images)
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

-- Show success message
SELECT 'SUCCESS: Slider table created! Check Settings > Admin Panel > Slider Images' as result;