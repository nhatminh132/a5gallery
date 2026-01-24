-- Create real-time global chat system
-- Uses Supabase Realtime for instant messaging

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can read, authenticated users can send
CREATE POLICY "Anyone can view chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can send messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can edit their own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Function to soft delete message
CREATE OR REPLACE FUNCTION soft_delete_chat_message(message_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chat_messages
  SET is_deleted = true
  WHERE id = message_uuid
  AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$;

-- Function to edit message
CREATE OR REPLACE FUNCTION edit_chat_message(
  message_uuid UUID,
  user_uuid UUID,
  new_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chat_messages
  SET message = new_message,
      edited_at = NOW()
  WHERE id = message_uuid
  AND user_id = user_uuid
  AND is_deleted = false;
  
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION soft_delete_chat_message TO authenticated;
GRANT EXECUTE ON FUNCTION edit_chat_message TO authenticated;

-- Add comments
COMMENT ON TABLE public.chat_messages IS 'Global chat messages with real-time updates';
COMMENT ON COLUMN public.chat_messages.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN public.chat_messages.edited_at IS 'Timestamp of last edit';
