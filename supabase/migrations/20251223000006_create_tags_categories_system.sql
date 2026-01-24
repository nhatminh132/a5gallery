/*
  # Create Tags and Categories System

  ## Overview
  This migration creates tables for tags and categories functionality:
  - tags: User-generated tags for media
  - categories: Predefined categories for organizing media
  - media_tags: Many-to-many relationship between media and tags
  - Enhanced profiles table with bio and avatar support
  
  ## Changes
  1. Create tags table
  2. Create categories table
  3. Create media_tags junction table
  4. Add category_id to media table
  5. Enhance profiles table
  6. Add RLS policies for all tables
  7. Create indexes for performance
  
  ## Security
  - Users can create tags and assign them to their media
  - Admins can create categories
  - Everyone can view tags and categories
  - Users can only tag their own media
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
  media_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS media_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, tag_id) -- Prevent duplicate tag assignments
);

-- Add category_id to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Enhance profiles table with additional fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_public": true, "media_public": true}',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email_notifications": true, "push_notifications": true}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags(created_by);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_media_count ON categories(media_count DESC);

CREATE INDEX IF NOT EXISTS idx_media_tags_media_id ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag_id ON media_tags(tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_tags_unique ON media_tags(media_id, tag_id);

CREATE INDEX IF NOT EXISTS idx_media_category_id ON media(category_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;

-- Tags policies
-- Everyone can view tags
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own tags
CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own tags if not in use
CREATE POLICY "Users can delete unused own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND usage_count = 0);

-- Categories policies
-- Everyone can view categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can create categories
CREATE POLICY "Only admins can create categories"
  ON categories FOR INSERT
  TO authenticated
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

-- Only admins can update categories
CREATE POLICY "Only admins can update categories"
  ON categories FOR UPDATE
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
  );

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories"
  ON categories FOR DELETE
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
  );

-- Media tags policies
-- Everyone can view media tags
CREATE POLICY "Anyone can view media tags"
  ON media_tags FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can tag their own media
CREATE POLICY "Users can tag own media"
  ON media_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM media 
      WHERE media.id = media_tags.media_id 
      AND media.user_id = auth.uid()
    )
  );

-- Users can remove tags from their own media
CREATE POLICY "Users can remove tags from own media"
  ON media_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media 
      WHERE media.id = media_tags.media_id 
      AND media.user_id = auth.uid()
    )
  );

-- Create functions to update counts
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags 
    SET usage_count = GREATEST(0, usage_count - 1) 
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_category_media_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update new category count
    IF NEW.category_id IS NOT NULL THEN
      UPDATE categories 
      SET media_count = (
        SELECT COUNT(*) FROM media WHERE media.category_id = NEW.category_id
      ) 
      WHERE categories.id = NEW.category_id;
    END IF;
    
    -- Update old category count (for updates)
    IF TG_OP = 'UPDATE' AND OLD.category_id IS NOT NULL AND OLD.category_id != NEW.category_id THEN
      UPDATE categories 
      SET media_count = (
        SELECT COUNT(*) FROM media WHERE media.category_id = OLD.category_id
      ) 
      WHERE categories.id = OLD.category_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update old category count
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories 
      SET media_count = (
        SELECT COUNT(*) FROM media WHERE media.category_id = OLD.category_id
      ) 
      WHERE categories.id = OLD.category_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_tag_usage_count_trigger
  AFTER INSERT OR DELETE ON media_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER update_category_media_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_category_media_count();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, DELETE ON media_tags TO authenticated;
GRANT SELECT ON tags TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON media_tags TO anon;

-- Add helpful comments
COMMENT ON TABLE tags IS 'User-generated tags for organizing media';
COMMENT ON TABLE categories IS 'Admin-created categories for media organization';
COMMENT ON TABLE media_tags IS 'Many-to-many relationship between media and tags';
COMMENT ON COLUMN tags.color IS 'Hex color code for tag display (#RRGGBB)';
COMMENT ON COLUMN tags.usage_count IS 'Number of times this tag has been used';
COMMENT ON COLUMN categories.media_count IS 'Number of media items in this category';
COMMENT ON COLUMN media.category_id IS 'Optional category assignment for media';

-- Add constraints
ALTER TABLE tags 
ADD CONSTRAINT check_tag_name_length 
CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 50);

ALTER TABLE tags 
ADD CONSTRAINT check_tag_color_format 
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE categories 
ADD CONSTRAINT check_category_name_length 
CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);

ALTER TABLE categories 
ADD CONSTRAINT check_category_color_format 
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Create some default categories (optional)
INSERT INTO categories (name, description, color, created_by) 
SELECT 
  category_name,
  category_desc,
  category_color,
  (SELECT id FROM profiles WHERE is_admin = true OR email = 'lpnminh472@gmail.com' LIMIT 1)
FROM (VALUES 
  ('General', 'General media content', '#6B7280'),
  ('Events', 'Event photos and videos', '#3B82F6'),
  ('Nature', 'Nature and landscape media', '#10B981'),
  ('People', 'Photos and videos of people', '#F59E0B'),
  ('Art', 'Artistic and creative content', '#8B5CF6'),
  ('Travel', 'Travel and adventure media', '#06B6D4')
) AS default_categories(category_name, category_desc, category_color)
WHERE EXISTS (SELECT 1 FROM profiles WHERE is_admin = true OR email = 'lpnminh472@gmail.com')
ON CONFLICT (name) DO NOTHING;

-- Verify tables creation
SELECT 
  'SUCCESS: Tags and Categories system created!' as status,
  (SELECT COUNT(*) FROM tags) as total_tags,
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM media_tags) as total_tag_assignments,
  'Ready for organization features' as next_step;