-- Add mentions system for comments
-- Users can mention others using @username

-- Create mentions table
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioning_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  UNIQUE(comment_id, mentioned_user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user ON public.mentions(mentioned_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mentions_comment ON public.mentions(comment_id);

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mentions"
  ON public.mentions
  FOR SELECT
  USING (auth.uid() = mentioned_user_id);

CREATE POLICY "Authenticated users can create mentions"
  ON public.mentions
  FOR INSERT
  WITH CHECK (auth.uid() = mentioning_user_id);

CREATE POLICY "Users can update their own mentions"
  ON public.mentions
  FOR UPDATE
  USING (auth.uid() = mentioned_user_id);

-- Function to extract and create mentions from comment text
CREATE OR REPLACE FUNCTION process_comment_mentions(
  comment_uuid UUID,
  comment_text TEXT,
  user_uuid UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mention_match TEXT;
  username TEXT;
  mentioned_user_id UUID;
  mentions_created INTEGER := 0;
BEGIN
  -- Extract all @mentions from text using regex
  FOR mention_match IN
    SELECT unnest(regexp_matches(comment_text, '@(\w+)', 'g'))
  LOOP
    username := mention_match;
    
    -- Find user by username (using full_name as username for now)
    SELECT id INTO mentioned_user_id
    FROM public.profiles
    WHERE LOWER(full_name) = LOWER(username)
    LIMIT 1;
    
    -- If user found and not self-mention, create mention
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != user_uuid THEN
      INSERT INTO public.mentions (comment_id, mentioned_user_id, mentioning_user_id)
      VALUES (comment_uuid, mentioned_user_id, user_uuid)
      ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
      
      mentions_created := mentions_created + 1;
    END IF;
  END LOOP;
  
  RETURN mentions_created;
END;
$$;

-- Function to get unread mentions for a user
CREATE OR REPLACE FUNCTION get_unread_mentions(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  comment_id UUID,
  comment_text TEXT,
  mentioning_user_id UUID,
  mentioning_user_name TEXT,
  media_id UUID,
  media_title TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.comment_id,
    c.text as comment_text,
    m.mentioning_user_id,
    p.full_name as mentioning_user_name,
    c.media_id,
    med.title as media_title,
    m.created_at
  FROM public.mentions m
  JOIN public.comments c ON c.id = m.comment_id
  JOIN public.profiles p ON p.id = m.mentioning_user_id
  JOIN public.media med ON med.id = c.media_id
  WHERE m.mentioned_user_id = user_uuid
  AND m.is_read = false
  ORDER BY m.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to mark mention as read
CREATE OR REPLACE FUNCTION mark_mention_read(mention_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.mentions
  SET is_read = true
  WHERE id = mention_uuid
  AND mentioned_user_id = user_uuid;
  
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_comment_mentions TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_mentions TO authenticated;
GRANT EXECUTE ON FUNCTION mark_mention_read TO authenticated;

-- Add comments
COMMENT ON TABLE public.mentions IS 'Tracks @mentions in comments';
COMMENT ON FUNCTION process_comment_mentions IS 'Extracts @mentions from comment text and creates mention records';
COMMENT ON FUNCTION get_unread_mentions IS 'Gets unread mentions for a user with comment and media context';
