-- Update AI caption usage to track GLOBAL daily limit instead of per-user
-- New system: 10 captions/day total for all normal users combined
-- Admins have unlimited access

-- Drop old table and create new simplified one for global tracking
DROP TABLE IF EXISTS public.ai_caption_usage CASCADE;

-- Create new table for global daily usage tracking
CREATE TABLE IF NOT EXISTS public.ai_caption_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for efficient daily count lookups
CREATE INDEX IF NOT EXISTS idx_ai_caption_usage_date 
  ON public.ai_caption_usage(created_at DESC);

-- Add index for user lookups (to show history)
CREATE INDEX IF NOT EXISTS idx_ai_caption_usage_user
  ON public.ai_caption_usage(user_id, created_at DESC);

-- Add RLS policies
ALTER TABLE public.ai_caption_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage history
CREATE POLICY "Users can view their own AI caption usage"
  ON public.ai_caption_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all AI caption usage"
  ON public.ai_caption_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Service role can insert records (bypasses RLS)
CREATE POLICY "Service can insert AI caption usage"
  ON public.ai_caption_usage
  FOR INSERT
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.ai_caption_usage IS 'Tracks AI caption generation usage for GLOBAL rate limiting. Limit: 10 captions/day for all normal users combined. Admins unlimited.';
COMMENT ON COLUMN public.ai_caption_usage.user_id IS 'User who generated the caption';
COMMENT ON COLUMN public.ai_caption_usage.created_at IS 'When the caption was generated';
