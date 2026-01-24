-- Add emoji reactions system for media and comments

-- Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL, -- emoji character like 👍 ❤️ 😂 etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, media_id, emoji),
  UNIQUE(user_id, comment_id, emoji),
  CHECK (
    (media_id IS NOT NULL AND comment_id IS NULL) OR
    (media_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reactions_media_id ON public.reactions(media_id) WHERE media_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON public.reactions(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_emoji ON public.reactions(emoji);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reactions"
  ON public.reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get reaction counts for media
CREATE OR REPLACE FUNCTION get_media_reactions(media_uuid UUID)
RETURNS TABLE (emoji VARCHAR(10), count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.emoji,
    COUNT(*)::BIGINT as count
  FROM public.reactions r
  WHERE r.media_id = media_uuid
  GROUP BY r.emoji
  ORDER BY count DESC, r.emoji ASC;
END;
$$;

-- Function to get reaction counts for comment
CREATE OR REPLACE FUNCTION get_comment_reactions(comment_uuid UUID)
RETURNS TABLE (emoji VARCHAR(10), count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.emoji,
    COUNT(*)::BIGINT as count
  FROM public.reactions r
  WHERE r.comment_id = comment_uuid
  GROUP BY r.emoji
  ORDER BY count DESC, r.emoji ASC;
END;
$$;

-- Function to toggle reaction (add if not exists, remove if exists)
CREATE OR REPLACE FUNCTION toggle_reaction(
  user_uuid UUID,
  target_media_uuid UUID DEFAULT NULL,
  target_comment_uuid UUID DEFAULT NULL,
  reaction_emoji VARCHAR(10) DEFAULT '👍'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_reaction UUID;
  added BOOLEAN;
BEGIN
  -- Check if reaction already exists
  IF target_media_uuid IS NOT NULL THEN
    SELECT id INTO existing_reaction
    FROM public.reactions
    WHERE user_id = user_uuid
    AND media_id = target_media_uuid
    AND emoji = reaction_emoji;
  ELSIF target_comment_uuid IS NOT NULL THEN
    SELECT id INTO existing_reaction
    FROM public.reactions
    WHERE user_id = user_uuid
    AND comment_id = target_comment_uuid
    AND emoji = reaction_emoji;
  END IF;

  IF existing_reaction IS NOT NULL THEN
    -- Remove reaction
    DELETE FROM public.reactions WHERE id = existing_reaction;
    added := false;
  ELSE
    -- Add reaction
    IF target_media_uuid IS NOT NULL THEN
      INSERT INTO public.reactions (user_id, media_id, emoji)
      VALUES (user_uuid, target_media_uuid, reaction_emoji);
    ELSIF target_comment_uuid IS NOT NULL THEN
      INSERT INTO public.reactions (user_id, comment_id, emoji)
      VALUES (user_uuid, target_comment_uuid, reaction_emoji);
    END IF;
    added := true;
  END IF;

  RETURN added;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_media_reactions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_comment_reactions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_reaction TO authenticated;

-- Add comments
COMMENT ON TABLE public.reactions IS 'Emoji reactions for media and comments';
COMMENT ON COLUMN public.reactions.emoji IS 'Emoji character (e.g., 👍 ❤️ 😂 🔥 🎉)';
COMMENT ON FUNCTION toggle_reaction IS 'Add or remove a reaction (toggle behavior)';
