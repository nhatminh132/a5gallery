/*
  # Create Slider Featured Images Table

  ## Overview
  This migration creates a table to store which images should be featured in the dashboard slider.
  Only admins can manage which images appear in the slider.
  
  ## Changes
  1. Create slider_featured table to store featured image selections
  2. Add RLS policies for admin-only access
  3. Create function for easy table creation
  
  ## Security
  - Only admin users can insert, update, or delete featured images
  - All users can read featured images (for the slider display)
*/

-- Create slider_featured table
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
CREATE INDEX IF NOT EXISTS idx_slider_featured_created_by ON slider_featured(created_by);

-- Enable RLS
ALTER TABLE slider_featured ENABLE ROW LEVEL SECURITY;

-- Allow all users to read featured images (for slider display)
CREATE POLICY "Anyone can view featured slider images"
  ON slider_featured FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can manage featured images
CREATE POLICY "Only admins can manage featured slider images"
  ON slider_featured FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('ADMIN', 'SUPER_ADMIN') OR profiles.is_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('ADMIN', 'SUPER_ADMIN') OR profiles.is_admin = true)
    )
  );

-- Create function to help with table creation (for app usage)
CREATE OR REPLACE FUNCTION create_slider_featured_table()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'slider_featured table already exists'::TEXT;
$$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_slider_featured_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_slider_featured_updated_at
  BEFORE UPDATE ON slider_featured
  FOR EACH ROW
  EXECUTE FUNCTION update_slider_featured_updated_at();

-- Add comments
COMMENT ON TABLE slider_featured IS 'Stores which images are featured in the dashboard slider, managed by admins only';
COMMENT ON COLUMN slider_featured.display_order IS 'Order in which images appear in the slider (0 = first)';
COMMENT ON COLUMN slider_featured.created_by IS 'Admin user who added this image to the slider';

-- Grant necessary permissions
GRANT SELECT ON slider_featured TO authenticated, anon;
GRANT ALL ON slider_featured TO authenticated;

-- Add some example data (optional - remove if not wanted)
-- This will feature the 3 most recent images by default
INSERT INTO slider_featured (media_id, display_order, created_by)
SELECT 
  id as media_id,
  ROW_NUMBER() OVER (ORDER BY upload_date DESC) - 1 as display_order,
  user_id as created_by
FROM media 
WHERE media_type = 'image' 
ORDER BY upload_date DESC 
LIMIT 3
ON CONFLICT DO NOTHING;