/*
  # Create Comments and Likes System

  ## Overview
  This migration creates tables for comments and likes functionality:
  - comments: User comments on media
  - likes: User likes on media
  
  ## Changes
  1. Create comments table
  2. Create likes table
  3. Add RLS policies for both tables
  4. Create indexes for performance
  
  ## Security
  - Users can create/edit/delete their own comments
  - Admins can delete any comments
  - Users can like/unlike media
  - Everyone can view comments and like counts
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_id, user_id) -- Prevent duplicate likes from same user
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON comments(media_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

CREATE INDEX IF NOT EXISTS idx_likes_media_id ON likes(media_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique_user_media ON likes(user_id, media_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Comments policies
-- Everyone can view comments
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete own comments, admins can delete any"
  ON comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.is_admin = true 
        OR profiles.email = 'lpnminh472@gmail.com'
      )
    )
  );

-- Likes policies
-- Everyone can view likes
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes (unlike)
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update comments updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON likes TO authenticated;
GRANT SELECT ON comments TO anon;
GRANT SELECT ON likes TO anon;

-- Add helpful comments
COMMENT ON TABLE comments IS 'User comments on media files';
COMMENT ON TABLE likes IS 'User likes on media files';
COMMENT ON COLUMN comments.content IS 'Comment text content (max 500 characters)';
COMMENT ON COLUMN likes.media_id IS 'References media.id - which media is liked';
COMMENT ON COLUMN likes.user_id IS 'References profiles.id - who liked the media';

-- Add constraint for comment length
ALTER TABLE comments 
ADD CONSTRAINT check_comment_length 
CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 500);

-- Verify tables creation
SELECT 
  'SUCCESS: Comments and Likes tables created!' as status,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM likes) as total_likes,
  'Ready for social features' as next_step;