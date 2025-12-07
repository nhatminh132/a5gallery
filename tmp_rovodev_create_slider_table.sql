-- Quick script to create slider_featured table manually
-- Run this in your Supabase SQL Editor

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
      AND (profiles.role IN ('ADMIN', 'SUPER_ADMIN') OR profiles.is_admin = true OR profiles.email = 'lpnminh472@gmail.com')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('ADMIN', 'SUPER_ADMIN') OR profiles.is_admin = true OR profiles.email = 'lpnminh472@gmail.com')
    )
  );

-- Verify table creation
SELECT 'slider_featured table created successfully!' as result;